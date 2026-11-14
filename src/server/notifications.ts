import { and, count, desc, eq, isNull, lt, isNotNull } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { relativeDay, upcoming } from '@/server/upcoming';
import { formatMoney } from '@/lib/money';
import { today } from '@/lib/dates';

const n = schema.notifications;

function nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Creates a notification for everything that is due now or overdue. Each
 * occurrence has a stable key, so it is only ever notified once.
 */
export function generateNotifications() {
    const date = today();
    const time = nowTime();
    let created = 0;

    for (const { id: userId } of db.select({ id: schema.users.id }).from(schema.users).all()) {
        for (const item of upcoming(userId, 0)) {
            // Timed reminders fire at their time; everything else from the start of the day.
            if (item.date === date && item.time && item.time !== '00:00' && item.time > time) continue;

            const amount = item.amountMinor != null && item.currency ? ` · ${formatMoney(item.amountMinor, item.currency)}` : '';
            const result = db
                .insert(n)
                .values({
                    userId,
                    key: `${item.href}@${item.date}`,
                    title: item.title,
                    body: `${relativeDay(item.date)} · ${item.detail}${amount}`,
                    href: item.href,
                })
                .onConflictDoNothing()
                .run();
            created += result.changes;
        }

        // Keep the list short: drop read notifications after 90 days.
        db.delete(n)
            .where(and(eq(n.userId, userId), isNotNull(n.readAt), lt(n.createdAt, new Date(Date.now() - 90 * 86_400_000))))
            .run();
    }
    return created;
}

export function unreadCount(userId: string) {
    const [{ total }] = db.select({ total: count() }).from(n).where(and(eq(n.userId, userId), isNull(n.readAt))).all();
    return total;
}

export function listNotifications(userId: string, limit = 100) {
    return db.select().from(n).where(eq(n.userId, userId)).orderBy(desc(n.createdAt)).limit(limit).all();
}

export function latestUnread(userId: string, limit = 5) {
    return db
        .select({ id: n.id, title: n.title, body: n.body, href: n.href })
        .from(n)
        .where(and(eq(n.userId, userId), isNull(n.readAt)))
        .orderBy(desc(n.createdAt))
        .limit(limit)
        .all();
}
