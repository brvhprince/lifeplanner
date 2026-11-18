'use server';

import fs from 'node:fs/promises';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { destroySession, requireUser } from '@/server/auth/session';
import { verifyPassword } from '@/server/auth/password';
import { logActivity } from '@/server/activity';
import { BACKUP_DIR, MAX_UPLOAD_BYTES, backupPath, createBackup, makeStandalone, restoreBackup } from '@/server/backups';
import type { ActionState } from '@/lib/action-state';

export async function backupNow() {
    const user = await requireUser();
    const name = await createBackup('manual');
    logActivity(user.id, 'data.backup', `Backup created: ${name}`);
    revalidatePath('/settings');
}

export async function deleteBackup(name: string) {
    const user = await requireUser();
    const file = backupPath(name);
    if (!file) return;
    await Promise.all([file, `${file}-wal`, `${file}-shm`].map((f) => fs.rm(f, { force: true })));
    logActivity(user.id, 'data.backup_deleted', `Backup deleted: ${name}`);
    revalidatePath('/settings');
}

async function checkPassword(formData: FormData): Promise<ActionState | null> {
    const user = await requireUser();
    if (await verifyPassword(user.passwordHash, String(formData.get('password') ?? ''))) return null;
    return { error: 'Password is incorrect', fieldErrors: { password: 'Password is incorrect' } };
}

/**
 * Swaps in the backup, then signs out: the restored data has its own
 * sessions and password, so the user signs in again.
 */
async function restoreAndSignOut(file: string, label: string): Promise<ActionState> {
    const user = await requireUser();
    const { problem, safetyBackup } = await restoreBackup(file);
    if (problem) return { error: `Can’t restore this backup: ${problem}.` };

    // Record it in the restored data, if this user exists there.
    if (db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, user.id)).get()) {
        logActivity(user.id, 'data.restore', `Restored ${label}; previous data saved as ${safetyBackup}`);
    }
    await destroySession();
    redirect('/auth/sign-in?restored=1');
}

export async function restoreFromBackup(name: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const failed = await checkPassword(formData);
    if (failed) return failed;
    const file = backupPath(name);
    if (!file) return { error: 'Backup not found' };
    return restoreAndSignOut(file, name);
}

export async function uploadAndRestore(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const failed = await checkPassword(formData);
    if (failed) return failed;

    const upload = formData.get('backup');
    if (!(upload instanceof File) || !upload.size) return { error: 'Choose a backup file', fieldErrors: { backup: 'Choose a backup file' } };
    if (upload.size > MAX_UPLOAD_BYTES) return { error: 'Backups larger than 25 MB must be restored from the backups folder' };

    // Keep the upload in the backups folder so it shows in the list either way.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const name = `uploaded-${stamp}.db`;
    const file = backupPath(name)!;
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.writeFile(file, Buffer.from(await upload.arrayBuffer()), { mode: 0o600 });
    try {
        makeStandalone(file);
    } catch {
        // Not a database; the validation below reports it.
    }
    // On success this redirects; reaching the next line means it was rejected,
    // so don't keep an unusable file in the backups list.
    const rejected = await restoreAndSignOut(file, `uploaded file ${upload.name}`);
    await fs.rm(file, { force: true });
    return rejected;
}
