import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '@/server/db';
import { DATA_DIR } from '@/server/env';

export const BACKUP_DIR = path.join(/*turbopackIgnore: true*/ DATA_DIR, 'backups');
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MIGRATIONS = path.join(process.cwd(), 'drizzle');

export type BackupInfo = {
    name: string;
    size: number;
    modified: Date;
    /** Null when the file isn't a usable LifePlanner backup. */
    summary: { accounts: number; transactions: number; loans: number; people: number } | null;
    problem?: string;
};

/** Only plain `*.db` names inside the backups folder are ever touched. */
export function backupPath(name: string) {
    const base = path.basename(name);
    if (base !== name || !/^[\w.-]+\.db$/.test(base)) return null;
    return path.join(BACKUP_DIR, base);
}

/**
 * Reserves a new, unique file name in `dir` (timestamp + random suffix,
 * created exclusively), so concurrent backups can never overwrite each other.
 */
export function allocateFile(prefix: string, dir = BACKUP_DIR) {
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    for (;;) {
        const name = `${prefix}-${stamp}-${crypto.randomBytes(3).toString('hex')}.db`;
        const file = path.join(dir, name);
        try {
            fs.closeSync(fs.openSync(file, 'wx', 0o600));
            return { name, file };
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        }
    }
}

/**
 * Turns a copy into a single self-contained file. Copies of a WAL database
 * keep its WAL mode, which makes SQLite create -wal/-shm files beside them.
 */
export function makeStandalone(file: string) {
    const copy = new Database(file, { fileMustExist: true });
    try {
        copy.pragma('journal_mode = DELETE');
    } finally {
        copy.close();
    }
}

/**
 * Writes a consistent, self-contained copy of the live database. VACUUM INTO
 * is synchronous, so no other request can change data while it runs.
 */
export function snapshotTo(file: string) {
    db.$client.prepare('VACUUM INTO ?').run(file);
}

export function createBackup(prefix: string) {
    const { name, file } = allocateFile(prefix);
    try {
        snapshotTo(file);
    } catch (error) {
        fs.rmSync(file, { force: true });
        throw error;
    }
    return name;
}

let required: string[] | undefined;

/** Tables every LifePlanner database has: those created by the first migration. */
function requiredTables() {
    if (!required) {
        const journal = JSON.parse(fs.readFileSync(path.join(MIGRATIONS, 'meta', '_journal.json'), 'utf8'));
        const first = fs.readFileSync(path.join(MIGRATIONS, `${journal.entries[0].tag}.sql`), 'utf8');
        required = [...first.matchAll(/CREATE TABLE [`"]?(\w+)[`"]?/gi)].map((m) => m[1]);
    }
    return required;
}

function appliedMigrations(connection: Database.Database) {
    return (connection.prepare('select count(*) as n from __drizzle_migrations').get() as { n: number }).n;
}

/**
 * Checks that a file is an undamaged LifePlanner database that this version
 * can use (all core tables present, not from a newer version).
 */
export function inspectBackup(file: string): { problem?: string; summary?: BackupInfo['summary'] } {
    try {
        const fd = fs.openSync(file, 'r');
        const header = Buffer.alloc(16);
        fs.readSync(fd, header, 0, 16, 0);
        fs.closeSync(fd);
        if (header.toString('latin1') !== 'SQLite format 3\0') return { problem: 'Not a SQLite database' };

        const source = new Database(file, { readonly: true, fileMustExist: true });
        try {
            if (source.pragma('quick_check', { simple: true }) !== 'ok') return { problem: 'The file is damaged' };
            const tables = new Set((source.prepare("select name from sqlite_master where type = 'table'").all() as { name: string }[]).map((t) => t.name));
            if (!tables.has('__drizzle_migrations') || requiredTables().some((t) => !tables.has(t))) return { problem: 'Not a LifePlanner backup' };
            if (appliedMigrations(source) > appliedMigrations(db.$client)) return { problem: 'Made by a newer version of LifePlanner' };
            const count = (table: string) => (tables.has(table) ? (source.prepare(`select count(*) as n from "${table}"`).get() as { n: number }).n : 0);
            return { summary: { accounts: count('accounts'), transactions: count('transactions'), loans: count('debts'), people: count('relationships') } };
        } finally {
            source.close();
        }
    } catch (error) {
        return { problem: `Can't be read (${(error as Error).message})` };
    }
}

export function listBackups(): BackupInfo[] {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    return fs
        .readdirSync(BACKUP_DIR)
        .filter((name) => backupPath(name))
        .map((name) => {
            const file = path.join(BACKUP_DIR, name);
            const stat = fs.statSync(file);
            const { problem, summary } = stat.size ? inspectBackup(file) : { problem: 'Empty file', summary: undefined };
            return { name, size: stat.size, modified: stat.mtime, summary: summary ?? null, problem };
        })
        .sort((a, b) => b.modified.getTime() - a.modified.getTime());
}

/**
 * Replaces the live data with a backup.
 *
 * 1. The backup is copied to a staging file and migrated there, so a failed
 *    upgrade never touches live data.
 * 2. Then, synchronously (nothing else can run in between): a safety snapshot
 *    of the current data, and the replacement of every table inside one
 *    transaction, which also signs every session out. Any error rolls back.
 */
export function restoreBackup(file: string): { problem?: string; safetyBackup?: string } {
    const { problem } = inspectBackup(file);
    if (problem) return { problem };

    const staging = allocateFile('restore-staging', os.tmpdir()).file;
    try {
        fs.copyFileSync(file, staging);
        const stagingDb = new Database(staging);
        try {
            stagingDb.pragma('journal_mode = DELETE');
            migrate(drizzle(stagingDb), { migrationsFolder: MIGRATIONS });
        } catch (error) {
            return { problem: `Upgrading the backup failed (${(error as Error).message})` };
        } finally {
            stagingDb.close();
        }

        // --- Critical section: synchronous from here to the end. ---
        const safety = allocateFile('before-restore');
        snapshotTo(safety.file);

        const live = db.$client;
        live.pragma('foreign_keys = OFF');
        live.prepare('ATTACH DATABASE ? AS restore').run(staging);
        try {
            live.transaction(() => {
                const tables = live
                    .prepare("select name from main.sqlite_master where type = 'table' and name not like 'sqlite_%'")
                    .all() as { name: string }[];
                for (const { name } of tables) {
                    const columns = (live.prepare(`select name from pragma_table_info(?)`).all(name) as { name: string }[])
                        .map((c) => `"${c.name}"`)
                        .join(', ');
                    live.exec(`delete from main."${name}"; insert into main."${name}" (${columns}) select ${columns} from restore."${name}"`);
                }
                // Restored sessions may have been revoked since; everyone signs in again.
                live.exec('delete from main.sessions');
                if (live.prepare('pragma main.foreign_key_check').all().length) throw new Error('The backup has inconsistent links between records');
            })();
        } catch (error) {
            fs.rmSync(safety.file, { force: true });
            return { problem: (error as Error).message };
        } finally {
            live.exec('DETACH DATABASE restore');
            live.pragma('foreign_keys = ON');
        }
        return { safetyBackup: safety.name };
    } finally {
        for (const f of [staging, `${staging}-journal`, `${staging}-wal`, `${staging}-shm`]) fs.rmSync(f, { force: true });
    }
}
