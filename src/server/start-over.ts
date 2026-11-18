'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import { revalidatePath } from 'next/cache';
import { and, eq, inArray, like, or } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { requireUser } from '@/server/auth/session';
import { DATA_DIR } from '@/server/env';
import { deleteEntityFiles } from '@/server/files';
import { logActivity } from '@/server/activity';
import type { ActionState } from '@/lib/action-state';

const CONFIRMATION = 'START OVER';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Clears the user's money records (accounts, transactions, transfers and
 * loans) so they can start again, after writing a full database backup.
 * Categories, bills, goals, people and everything else are kept.
 */
export async function startOverWithMoney(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    if (String(formData.get('confirm') ?? '').trim().toUpperCase() !== CONFIRMATION) {
        return { error: `Type ${CONFIRMATION} to confirm`, fieldErrors: { confirm: `Type ${CONFIRMATION} to confirm` } };
    }

    // 1. A consistent copy of the whole database, so this can be undone.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(/*turbopackIgnore: true*/ DATA_DIR, 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `before-start-over-${stamp}.db`);
    await db.$client.backup(backupFile);

    const { transactions: t, transfers, debts, accounts, timelineEntries: tl, notifications: n } = schema;
    const txIds = db.select({ id: t.id }).from(t).where(eq(t.userId, user.id)).all().map((r) => r.id);
    const debtIds = db.select({ id: debts.id }).from(debts).where(eq(debts.userId, user.id)).all().map((r) => r.id);

    // 2. Files attached to transactions and loans (receipts, agreements).
    await deleteEntityFiles(user.id, 'transaction', txIds);
    await deleteEntityFiles(user.id, 'debts', debtIds);

    // 3. The records themselves; children first because of foreign keys.
    const counts = db.transaction((tx) => {
        const removed = {
            transactions: tx.delete(t).where(eq(t.userId, user.id)).run().changes,
            transfers: tx.delete(transfers).where(eq(transfers.userId, user.id)).run().changes,
            loans: 0,
            accounts: 0,
        };
        if (debtIds.length) tx.delete(tl).where(and(eq(tl.userId, user.id), eq(tl.entityType, 'debts'), inArray(tl.entityId, debtIds))).run();
        removed.loans = tx.delete(debts).where(eq(debts.userId, user.id)).run().changes;
        removed.accounts = tx.delete(accounts).where(eq(accounts.userId, user.id)).run().changes;
        tx.delete(n)
            .where(and(eq(n.userId, user.id), or(like(n.href, '/debts/%'), like(n.href, '/transactions/%'), like(n.href, '/accounts/%'))))
            .run();
        return removed;
    });

    logActivity(user.id, 'data.start_over', 'Cleared money records to start over', { backup: path.basename(backupFile), ...counts });
    revalidatePath('/', 'layout');
    return {
        ok: true,
        message: `Cleared ${plural(counts.accounts, 'account')}, ${plural(counts.transactions, 'transaction')} and ${plural(counts.loans, 'loan')}. Backup saved as backups/${path.basename(backupFile)}`,
    };
}
