import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_PATH } from '../env';
import * as schema from './schema';

export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

function open(): Db {
    const sqlite = new Database(DB_PATH);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('busy_timeout = 5000');
    sqlite.pragma('synchronous = NORMAL');
    return drizzle(sqlite, { schema });
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { lifeplannerDb?: Db };

export const db = globalForDb.lifeplannerDb ?? open();
if (process.env.NODE_ENV !== 'production') globalForDb.lifeplannerDb = db;

export { schema };
