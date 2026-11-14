'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { requireUser } from '@/server/auth/session';

const n = schema.notifications;

/** Marks a notification read and opens what it refers to. */
export async function openNotification(id: string) {
    const user = await requireUser();
    const row = db.select().from(n).where(and(eq(n.id, id), eq(n.userId, user.id))).get();
    if (!row) redirect('/notifications');
    db.update(n).set({ readAt: new Date() }).where(eq(n.id, id)).run();
    revalidatePath('/', 'layout');
    // Only follow internal links.
    redirect(row.href?.startsWith('/') && !row.href.startsWith('//') ? row.href : '/notifications');
}

export async function markAllRead() {
    const user = await requireUser();
    db.update(n).set({ readAt: new Date() }).where(and(eq(n.userId, user.id), isNull(n.readAt))).run();
    revalidatePath('/', 'layout');
}
