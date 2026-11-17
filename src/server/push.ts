import fs from 'node:fs';
import path from 'node:path';
import { generateVAPIDKeys, sendNotification } from 'web-push';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { DATA_DIR } from '@/server/env';
import { isAllowedPushEndpoint } from '../lib/push-hosts';

export type PushPayload = { title: string; body?: string; url?: string; tag?: string };

let keys: { publicKey: string; privateKey: string } | undefined;

/**
 * VAPID keys that identify this server to browser push services. Taken from
 * VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY, or generated once and kept next to the
 * database. Changing them invalidates every device's subscription.
 */
export function vapidKeys() {
    if (keys) return keys;
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        keys = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
        return keys;
    }
    const file = path.join(DATA_DIR, 'vapid.json');
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(generateVAPIDKeys()), { mode: 0o600 });
    }
    keys = JSON.parse(fs.readFileSync(file, 'utf8'));
    return keys!;
}

/** The public key for browsers, or null if the keys can't be loaded (logged). */
export function vapidPublicKey(): string | null {
    try {
        return vapidKeys().publicKey;
    } catch (error) {
        console.error('[lifeplanner] push keys unavailable', (error as Error).message);
        return null;
    }
}

const extraHosts = () => (process.env.PUSH_ALLOWED_HOSTS ?? '').split(',').filter(Boolean);

export const isAllowedEndpoint = (endpoint: string) => isAllowedPushEndpoint(endpoint, extraHosts());

/** Sends a notification to every device the user enabled. Never throws. */
export async function sendPush(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
    try {
        const subs = db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId)).all();
        if (!subs.length) return { sent: 0, failed: 0 };

        const user = db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, userId)).get();
        const { publicKey, privateKey } = vapidKeys();
        // Push services (notably Apple's) require a contact URL or mailto: subject.
        const subject = process.env.VAPID_SUBJECT || `mailto:${user?.email ?? 'owner@example.com'}`;

        let sent = 0;
        let failed = 0;
        await Promise.all(
            subs.map(async (sub) => {
                // Never contact hosts other than browser push services.
                if (!isAllowedEndpoint(sub.endpoint)) {
                    failed++;
                    db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, sub.id)).run();
                    return;
                }
                try {
                    await sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        JSON.stringify(payload),
                        { vapidDetails: { subject, publicKey, privateKey }, TTL: 24 * 3600, urgency: 'normal', timeout: 10_000 }
                    );
                    sent++;
                    db.update(schema.pushSubscriptions).set({ lastSuccessAt: new Date() }).where(eq(schema.pushSubscriptions.id, sub.id)).run();
                } catch (error) {
                    failed++;
                    const status = (error as { statusCode?: number }).statusCode;
                    // 404/410: the browser dropped the subscription; forget the device.
                    if (status === 404 || status === 410) {
                        db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, sub.id)).run();
                    } else {
                        console.error('[lifeplanner] push failed', status ?? '', (error as Error).message);
                    }
                }
            })
        );
        return { sent, failed };
    } catch (error) {
        // Setup problems (e.g. an unreadable vapid.json) must not crash the scheduler.
        console.error('[lifeplanner] push unavailable', (error as Error).message);
        return { sent: 0, failed: 1 };
    }
}
