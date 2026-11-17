import { and, count, desc, eq, isNull, lt, isNotNull } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { relativeDay, upcoming, type UpcomingItem } from '@/server/upcoming';
import { sendPush } from '@/server/push';
import { formatMoney } from '@/lib/money';
import { today } from '@/lib/dates';
import { notificationKind } from '@/lib/notify';

const n = schema.notifications;

function nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const amountOf = (item: UpcomingItem) =>
    item.amountMinor != null && item.currency ? ` · ${formatMoney(item.amountMinor, item.currency)}` : '';

/**
 * Creates notifications for everything due now or overdue, plus a heads-up
 * `notifyDaysBefore` days ahead of bills, loans and deadlines. Each occurrence
 * has a stable key, so it notifies once. New notifications are also pushed to
 * the user's devices.
 */
export function generateNotifications() {
    const date = today();
    const time = nowTime();
    let created = 0;

    for (const user of db.select({ id: schema.users.id, daysBefore: schema.users.notifyDaysBefore }).from(schema.users).all()) {
        const userId = user.id;
        const fresh: { id: string; title: string; body: string | null; href: string | null }[] = [];
        const notify = (key: string, item: UpcomingItem, body: string) => {
            const row = db
                .insert(n)
                .values({ userId, key, title: item.title, body, href: item.href })
                .onConflictDoNothing()
                .returning({ id: n.id, title: n.title, body: n.body, href: n.href })
                .get();
            if (row) fresh.push(row);
        };

        for (const item of upcoming(userId, Math.max(0, user.daysBefore))) {
            const kind = notificationKind(item, { date, time });
            if (!kind) continue;
            const key = `${item.href}@${item.date}${kind === 'ahead' ? ':ahead' : ''}`;
            notify(key, item, `${relativeDay(item.date)} · ${item.detail}${amountOf(item)}`);
        }
        created += fresh.length;

        for (const row of fresh) {
            void sendPush(userId, { title: row.title, body: row.body ?? undefined, url: `/n/${row.id}`, tag: row.id });
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
