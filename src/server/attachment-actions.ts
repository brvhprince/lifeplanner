'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { requireUser } from '@/server/auth/session';
import { checkUpload, deleteFiles, storeAttachment } from '@/server/files';
import { getModule } from '@/lib/modules/definitions';
import { getRecord } from '@/server/modules/registry';
import type { ActionState } from '@/lib/action-state';

/** Path of the page showing an entity, or null if the user doesn't own it. */
function entityPage(userId: string, entityType: string, entityId: string) {
    if (entityType === 'transaction') {
        const t = schema.transactions;
        const row = db.select({ id: t.id }).from(t).where(and(eq(t.id, entityId), eq(t.userId, userId))).get();
        return row ? `/transactions/${entityId}` : null;
    }
    const def = getModule(entityType);
    return def && getRecord(def, userId, entityId) ? `/${def.key}/${entityId}` : null;
}

export async function uploadAttachments(entityType: string, entityId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const page = entityPage(user.id, entityType, entityId);
    if (!page) return { error: 'Record not found' };

    const uploads = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
    if (!uploads.length) return { error: 'Choose at least one file' };
    if (uploads.length > 20) return { error: 'Upload up to 20 files at a time' };

    const problems = uploads.map(checkUpload).filter(Boolean);
    if (problems.length) return { error: problems.join('. ') };

    for (const file of uploads) await storeAttachment(user.id, entityType, entityId, file);

    revalidatePath(page);
    revalidatePath(page.split('/').slice(0, 2).join('/'));
    return { ok: true, message: uploads.length === 1 ? 'File added' : `${uploads.length} files added` };
}

export async function deleteAttachment(fileId: string, page: string) {
    const user = await requireUser();
    await deleteFiles(user.id, [fileId]);
    revalidatePath(page);
}
