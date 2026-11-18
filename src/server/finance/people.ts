import 'server-only';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { listDebtStates } from '@/server/finance/debts';
import { currentMonth, shiftMonth } from '@/lib/dates';

const { transactions: t, accounts: a, categories: c } = schema;

export type MonthFlow = { month: string; given: number; received: number };

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

    const loans = listDebtStates(userId).filter(({ debt }) => debt.personId === personId);

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
