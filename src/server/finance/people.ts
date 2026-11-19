import 'server-only';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { listDebtStates } from '@/server/finance/debts';
import { currentMonth, shiftMonth } from '@/lib/dates';
import { formatMoney } from '@/lib/money';

const { transactions: t, accounts: a, categories: c } = schema;

export type MonthFlow = { month: string; given: number; received: number };

/** Chart-ready month with its labels formatted on the server (avoids hydration mismatches). */
export type ChartMonth = MonthFlow & { short: string; long: string; givenText: string; receivedText: string };

/** Rounds up to a clean axis maximum (1, 2, 2.5 or 5 × 10^n). */
export function niceMax(value: number) {
    if (value <= 0) return 1;
    const exp = 10 ** Math.floor(Math.log10(value));
    return ([1, 2, 2.5, 5, 10].find((m) => m * exp >= value) ?? 10) * exp;
}

export function chartData(months: MonthFlow[], currency: string) {
    const max = niceMax(Math.max(...months.map((m) => Math.max(m.given, m.received))));
    const label = (month: string, options: Intl.DateTimeFormatOptions) => new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, options);
    return {
        max,
        ticks: [max, max / 2, 0].map((value) => ({ value, label: formatMoney(value, currency).replace(/\.00$/, '') })),
        months: months.map((m) => ({
            ...m,
            short: label(m.month, { month: 'short' }),
            long: label(m.month, { month: 'long', year: 'numeric' }),
            givenText: formatMoney(m.given, currency),
            receivedText: formatMoney(m.received, currency),
        })) as ChartMonth[],
    };
}

/**
 * Money between the user and one person: what was given (expenses) and
 * received (income), month by month, by category, plus loans with them.
 * Loan principal isn't counted as given/received; it shows under loans.
 */
export function personMoney(userId: string, personId: string, mainCurrency: string) {
    const flows = sql`${t.kind} in ('income', 'expense')`;
    const mine = and(eq(t.userId, userId), eq(t.personId, personId), eq(t.status, 'active'));

    const totals = db
        .select({
            currency: a.currency,
            given: sql<number>`coalesce(-sum(case when ${t.kind} = 'expense' then ${t.amountMinor} end), 0)`,
            received: sql<number>`coalesce(sum(case when ${t.kind} = 'income' then ${t.amountMinor} end), 0)`,
            count: sql<number>`count(*)`,
            first: sql<string>`min(${t.occurredOn})`,
            last: sql<string>`max(${t.occurredOn})`,
        })
        .from(t)
        .innerJoin(a, eq(a.id, t.accountId))
        .where(and(mine, flows))
        .groupBy(a.currency)
        .all()
        .sort((x, y) => (x.currency === mainCurrency ? -1 : y.currency === mainCurrency ? 1 : x.currency.localeCompare(y.currency)));

    // Last 12 months in the main currency (or the only currency used with them).
    const chartCurrency = totals.find((x) => x.currency === mainCurrency)?.currency ?? totals[0]?.currency ?? mainCurrency;
    const end = currentMonth();
    const start = shiftMonth(end, -11);
    const byMonth = new Map(
        db
            .select({
                month: sql<string>`substr(${t.occurredOn}, 1, 7)`,
                given: sql<number>`coalesce(-sum(case when ${t.kind} = 'expense' then ${t.amountMinor} end), 0)`,
                received: sql<number>`coalesce(sum(case when ${t.kind} = 'income' then ${t.amountMinor} end), 0)`,
            })
            .from(t)
            .innerJoin(a, eq(a.id, t.accountId))
            .where(and(mine, flows, eq(a.currency, chartCurrency), gte(t.occurredOn, `${start}-01`)))
            .groupBy(sql`substr(${t.occurredOn}, 1, 7)`)
            .all()
            .map((r) => [r.month, r])
    );
    const months: MonthFlow[] = Array.from({ length: 12 }, (_, i) => {
        const month = shiftMonth(start, i);
        const row = byMonth.get(month);
        return { month, given: row?.given ?? 0, received: row?.received ?? 0 };
    });

    const byCategory = db
        .select({
            name: sql<string>`coalesce(${c.name}, 'Uncategorised')`,
            color: c.color,
            kind: t.kind,
            currency: a.currency,
            totalMinor: sql<number>`abs(sum(${t.amountMinor}))`,
        })
        .from(t)
        .innerJoin(a, eq(a.id, t.accountId))
        .leftJoin(c, eq(c.id, t.categoryId))
        .where(and(mine, flows))
        .groupBy(t.categoryId, t.kind, a.currency)
        .orderBy(sql`abs(sum(${t.amountMinor})) desc`)
        .limit(8)
        .all();

    const loans = listDebtStates(userId, { personId });

    const recent = db
        .select({
            id: t.id,
            kind: t.kind,
            title: t.title,
            amountMinor: t.amountMinor,
            occurredOn: t.occurredOn,
            currency: a.currency,
            category: c.name,
        })
        .from(t)
        .innerJoin(a, eq(a.id, t.accountId))
        .leftJoin(c, eq(c.id, t.categoryId))
        .where(mine)
        .orderBy(desc(t.occurredOn), desc(t.createdAt))
        .limit(10)
        .all();

    return { totals, chartCurrency, months, byCategory, loans, recent };
}
