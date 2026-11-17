import { and, eq, isNotNull, lte, sql } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { addPeriod, daysBetween, nextOccurrence, today } from '@/lib/dates';
import { listDebtStates } from '@/server/finance/debts';

export type UpcomingItem = {
    date: string;
    time?: string;
    title: string;
    detail: string;
    href: string;
    amountMinor?: number | null;
    currency?: string | null;
};

const DONE = ['completed', 'abandoned', 'terminated', 'cancelled', 'failed', 'paid'];

/** Everything due within `days` (plus anything overdue), soonest first. */
export function upcoming(userId: string, days = 30): UpcomingItem[] {
    const start = today();
    const end = (() => {
        let d = start;
        for (let i = 0; i < days; i++) d = addPeriod(d, 'daily');
        return d;
    })();
    const items: UpcomingItem[] = [];

    const s = schema.subscriptions;
    for (const r of db.select().from(s).where(and(eq(s.userId, userId), eq(s.status, 'active'), isNotNull(s.nextDueOn), lte(s.nextDueOn, end))).all()) {
        items.push({ date: r.nextDueOn!, title: r.title, detail: r.kind === 'income' ? 'Income expected' : 'Bill due', href: `/subscriptions/${r.id}`, amountMinor: r.amountMinor, currency: r.currency });
    }

    const sp = schema.savingsPlans;
    for (const r of db.select().from(sp).where(and(eq(sp.userId, userId), eq(sp.status, 'active'), isNotNull(sp.nextDueOn), lte(sp.nextDueOn, end))).all()) {
        items.push({ date: r.nextDueOn!, title: r.title, detail: 'Savings due', href: `/savings/${r.id}`, amountMinor: r.amountMinor, currency: r.currency });
    }

    // Debts show what is still outstanding, not the original total.
    for (const { debt: r, state } of listDebtStates(userId, { activeOnly: true })) {
        if (!r.dueOn || r.dueOn > end || state.outstanding === 0) continue;
        items.push({
            date: r.dueOn,
            title: r.title,
            detail: r.direction === 'lent' ? `${r.counterparty ?? 'Someone'} owes you` : `Pay ${r.counterparty ?? 'back'}`,
            href: `/debts/${r.id}`,
            amountMinor: state.outstanding,
            currency: r.currency,
        });
    }

    const g = schema.goals;
    for (const r of db.select().from(g).where(and(eq(g.userId, userId), eq(g.status, 'active'), isNotNull(g.deadline), lte(g.deadline, end))).all()) {
        items.push({ date: r.deadline!, title: r.title, detail: 'Goal deadline', href: `/goals/${r.id}` });
    }

    const deadlines = [
        { table: schema.projects, col: schema.projects.dueOn, key: 'projects', label: 'Project due' },
        { table: schema.learnings, col: schema.learnings.dueOn, key: 'learning', label: 'Learning due' },
        { table: schema.brandingGoals, col: schema.brandingGoals.dueOn, key: 'branding', label: 'Brand goal due' },
        { table: schema.futurePlans, col: schema.futurePlans.expectedOn, key: 'plans', label: 'Plan date' },
    ] as const;
    for (const { table, col, key, label } of deadlines) {
        const rows = db
            .select({ id: table.id, title: table.title, date: col })
            .from(table)
            .where(and(eq(table.userId, userId), isNotNull(col), lte(col, end), sql`${table.status} not in (${sql.join(DONE.map((v) => sql`${v}`), sql`, `)})`))
            .all();
        for (const r of rows) items.push({ date: r.date!, title: r.title, detail: label, href: `/${key}/${r.id}` });
    }

    const rem = schema.reminders;
    for (const r of db.select().from(rem).where(and(eq(rem.userId, userId), eq(rem.status, 'active'))).all()) {
        const startDate = r.startsAt.slice(0, 10);
        // One-off reminders stay visible once overdue; repeating ones show their next date.
        const next = r.frequency === 'never' ? startDate : nextOccurrence(startDate, r.frequency, start, r.endsOn);
        if (next && next <= end) {
            items.push({ date: next, time: r.startsAt.slice(11, 16), title: r.title, detail: 'Reminder', href: `/reminders/${r.id}`, amountMinor: r.amountMinor, currency: r.currency });
        }
    }

    const p = schema.relationships;
    for (const r of db.select().from(p).where(and(eq(p.userId, userId), isNotNull(p.birthday))).all()) {
        const [, mm, dd] = r.birthday!.split('-');
        let next = `${start.slice(0, 4)}-${mm}-${dd}`;
        if (next < start) next = `${Number(start.slice(0, 4)) + 1}-${mm}-${dd}`;
        if (next <= end) {
            const age = Number(next.slice(0, 4)) - Number(r.birthday!.slice(0, 4));
            items.push({ date: next, title: `${r.name}’s birthday`, detail: age > 0 && age < 130 ? `Turns ${age}` : 'Birthday', href: `/people/${r.id}` });
        }
    }

    return items.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
}

export function relativeDay(date: string) {
    const diff = daysBetween(today(), date);
    if (diff < -1) return `${-diff} days overdue`;
    if (diff === -1) return 'Yesterday';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
}

export function activeGoals(userId: string) {
    const g = schema.goals;
    const c = schema.goalContributions;
    return db
        .select({
            id: g.id,
            title: g.title,
            currency: g.currency,
            targetMinor: g.targetMinor,
            savedMinor: sql<number>`coalesce((select sum(${c.amountMinor}) from ${c} where ${c.goalId} = ${g.id}), 0)`,
        })
        .from(g)
        .where(and(eq(g.userId, userId), eq(g.status, 'active')))
        .limit(5)
        .all();
}
