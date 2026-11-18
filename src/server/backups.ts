import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '@/server/db';
import { DATA_DIR, DB_PATH } from '@/server/env';

export const BACKUP_DIR = path.join(/*turbopackIgnore: true*/ DATA_DIR, 'backups');
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

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
 * Turns a copy into a single self-contained file. Copies of the live database
 * inherit its WAL mode, which makes SQLite create -wal/-shm files beside them
 * whenever they're opened.
 */
export function makeStandalone(file: string) {
    const copy = new Database(file, { fileMustExist: true });
    try {
        copy.pragma('journal_mode = DELETE');
    } finally {
        copy.close();
    }
}

function appliedMigrations(connection: Database.Database) {
    return (connection.prepare('select count(*) as n from __drizzle_migrations').get() as { n: number }).n;
}

/**
 * Checks that a file is an undamaged LifePlanner database that this version
 * can open (not from a newer version). Returns a reason when it isn't.
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
            if (!tables.has('users') || !tables.has('__drizzle_migrations')) return { problem: 'Not a LifePlanner backup' };
            if (appliedMigrations(source) > appliedMigrations(db.$client)) return { problem: 'Made by a newer version of LifePlanner' };
            const count = (table: string) => (tables.has(table) ? (source.prepare(`select count(*) as n from ${table}`).get() as { n: number }).n : 0);
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
            const stat = fs.statSync(path.join(BACKUP_DIR, name));
            const { problem, summary } = inspectBackup(path.join(BACKUP_DIR, name));
            return { name, size: stat.size, modified: stat.mtime, summary: summary ?? null, problem };
        })
        .sort((a, b) => b.modified.getTime() - a.modified.getTime());
}

/** Writes a consistent copy of the live database into the backups folder. */
export async function createBackup(prefix: string) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const name = `${prefix}-${stamp}.db`;
    await db.$client.backup(path.join(BACKUP_DIR, name));
    makeStandalone(path.join(BACKUP_DIR, name));
    return name;
}

/**
 * Replaces the live database with a backup: validates it, backs up the
 * current data first, copies the backup in through SQLite's online backup
 * (safe while the app is running), then applies any newer migrations.
 */
export async function restoreBackup(file: string): Promise<{ problem?: string; safetyBackup?: string }> {
    const { problem } = inspectBackup(file);
    if (problem) return { problem };

    const safetyBackup = await createBackup('before-restore');
    const source = new Database(file, { readonly: true, fileMustExist: true });
    try {
        await source.backup(DB_PATH);
    } finally {
        source.close();
    }
    migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
    return { safetyBackup };
}
