'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { requireUser } from '@/server/auth/session';
import { isAllowedEndpoint, sendPush, vapidPublicKey as vapidPublicKeyOrNull } from '@/server/push';
import { logActivity } from '@/server/activity';
import type { ActionState } from '@/lib/action-state';

const p = schema.pushSubscriptions;

type BrowserSubscription = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };

/** Saves (or re-assigns) this browser's push subscription. */
export async function savePushSubscription(subscription: BrowserSubscription, label: string) {
    const user = await requireUser();
    const endpoint = String(subscription?.endpoint ?? '');
    const p256dh = String(subscription?.keys?.p256dh ?? '');
    const auth = String(subscription?.keys?.auth ?? '');
    if (!isAllowedEndpoint(endpoint) || endpoint.length > 2000 || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) {
        return { ok: false };
    }
    const vapidPublicKey = vapidPublicKeyOrNull();
    if (!vapidPublicKey) return { ok: false };
    const values = { userId: user.id, endpoint, p256dh, auth, vapidPublicKey, label: label.slice(0, 80) || null };
    db.insert(p).values(values).onConflictDoUpdate({ target: p.endpoint, set: values }).run();
    logActivity(user.id, 'push.enabled', `Notifications turned on for ${values.label ?? 'a device'}`);
    revalidatePath('/settings');
    return { ok: true };
}

/**
 * Whether the server can deliver to this browser's subscription:
 * `current` = registered with the server's current key; `stale` = registered
 * with an older key (must re-subscribe); `missing` = not registered.
 */
export async function pushRegistrationStatus(endpoint: string): Promise<'current' | 'stale' | 'missing'> {
    const user = await requireUser();
    const row = db.select({ key: p.vapidPublicKey }).from(p).where(and(eq(p.userId, user.id), eq(p.endpoint, endpoint))).get();
    if (!row) return 'missing';
    const current = vapidPublicKeyOrNull();
    // Rows saved before keys were recorded can't be checked; assume they still work.
    return !row.key || row.key === current ? 'current' : 'stale';
}

/** Called when this browser turns notifications off. */
export async function removePushSubscriptionByEndpoint(endpoint: string) {
    const user = await requireUser();
    db.delete(p).where(and(eq(p.userId, user.id), eq(p.endpoint, endpoint))).run();
    revalidatePath('/settings');
}

/** "Remove" next to a device in Settings. */
export async function removePushSubscription(id: string) {
    const user = await requireUser();
    db.delete(p).where(and(eq(p.userId, user.id), eq(p.id, id))).run();
    revalidatePath('/settings');
}

export async function sendTestPush() {
    const user = await requireUser();
    const result = await sendPush(user.id, {
        title: 'LifePlanner test',
        body: 'Notifications are working on this device.',
        url: '/notifications',
        tag: 'test',
    });
    revalidatePath('/settings');
    return result;
}

export async function updateNotificationSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const days = Number(formData.get('notifyDaysBefore'));
    if (!Number.isInteger(days) || days < 0 || days > 30) {
        return { error: 'Choose between 0 and 30 days', fieldErrors: { notifyDaysBefore: 'Choose between 0 and 30 days' } };
    }
    db.update(schema.users).set({ notifyDaysBefore: days }).where(eq(schema.users.id, user.id)).run();
    revalidatePath('/settings');
    return { ok: true, message: days ? `You’ll be reminded ${days} day${days === 1 ? '' : 's'} ahead` : 'Reminders only on the day' };
}
