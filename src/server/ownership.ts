import 'server-only';
import { and, eq } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { db } from '@/server/db';

type OwnedTable = SQLiteTable & { id: SQLiteColumn; userId: SQLiteColumn };

/** True when the record exists and belongs to the user. */
export function ownsRecord(table: OwnedTable, userId: string, id: string) {
    return Boolean(db.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.userId, userId))).get());
}
