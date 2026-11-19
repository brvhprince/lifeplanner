'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray, like, or } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { requireUser } from '@/server/auth/session';
import { createBackup } from '@/server/backups';
import { verifyPassword } from '@/server/auth/password';
import { logActivity } from '@/server/activity';
import { formValues, type ActionState } from '@/lib/action-state';

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
    // As destructive as it gets, so it needs the password like 2FA changes do.
    if (!(await verifyPassword(user.passwordHash, String(formData.get('password') ?? '')))) {
        return { error: 'Password is incorrect', fieldErrors: { password: 'Password is incorrect' }, values: formValues(formData) };
    }

    const { transactions: t, transfers, debts, accounts, timelineEntries: tl, notifications: n, files, attachments } = schema;

    // Snapshot and deletion run synchronously, back to back, so no change made
    // by another request can land between the backup and the clean-up.
    const backupName = createBackup('before-start-over');

    const txIds = db.select({ id: t.id }).from(t).where(eq(t.userId, user.id)).all().map((r) => r.id);
    const debtIds = db.select({ id: debts.id }).from(debts).where(eq(debts.userId, user.id)).all().map((r) => r.id);
    // Files attached to transactions and loans (receipts, agreements).
    const attached = db
        .select({ id: files.id, path: files.path })
        .from(attachments)
        .innerJoin(files, eq(files.id, attachments.fileId))
        .where(
            and(
                eq(files.userId, user.id),
                or(
                    and(eq(attachments.entityType, 'transaction'), inArray(attachments.entityId, txIds.length ? txIds : [''])),
                    and(eq(attachments.entityType, 'debts'), inArray(attachments.entityId, debtIds.length ? debtIds : ['']))
                )
            )
        )
        .all();

    const counts = db.transaction((tx) => {
        if (attached.length) tx.delete(files).where(inArray(files.id, attached.map((f) => f.id))).run();
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

    // Attached files stay on disk: the backup only holds the database, and
    // restoring it brings their records back, so the files must still exist.

    logActivity(user.id, 'data.start_over', 'Cleared money records to start over', { backup: backupName, ...counts });
    revalidatePath('/', 'layout');
    return {
        ok: true,
        message: `Cleared ${plural(counts.accounts, 'account')}, ${plural(counts.transactions, 'transaction')} and ${plural(counts.loans, 'loan')}. Backup saved as ${backupName} (see Backups below)`,
    };
}
