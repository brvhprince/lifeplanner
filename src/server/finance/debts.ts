import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, schema, type Db } from '@/server/db';
import { computeDebtState, splitRepayment, type LegTotals } from '../../lib/loans';

export type { DebtState } from '../../lib/loans';

const { debts, transactions, categories, accounts } = schema;

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type Debt = typeof debts.$inferSelect;

/** Ledger totals per debt, from active loan-linked transactions. */
function legTotals(debtIds: string[], client: Tx | typeof db = db) {
    if (!debtIds.length) return new Map<string, LegTotals>();
    const t = transactions;
    const active = sql`${t.status} = 'active'`;
    const rows = client
        .select({
            debtId: t.debtId,
            repaid: sql<number>`coalesce(sum(case when ${active} and ${t.debtRole} in ('repayment', 'interest') then abs(${t.amountMinor}) end), 0)`,
            interestPaid: sql<number>`coalesce(sum(case when ${active} and ${t.debtRole} = 'interest' then abs(${t.amountMinor}) end), 0)`,
            disbursed: sql<number>`count(case when ${active} and ${t.debtRole} = 'disbursement' then 1 end)`,
        })
        .from(t)
        .where(inArray(t.debtId, debtIds))
        .groupBy(t.debtId)
        .all();
    return new Map(rows.map((r) => [r.debtId!, r]));
}

export function debtState(debt: Debt, client: Tx | typeof db = db) {
    return computeDebtState(debt, legTotals([debt.id], client).get(debt.id));
}

/** All of a user's debts with their ledger-derived state. */
export function listDebtStates(userId: string, { activeOnly = false, personId }: { activeOnly?: boolean; personId?: string } = {}) {
    const rows = db
        .select()
        .from(debts)
        .where(and(eq(debts.userId, userId), activeOnly ? eq(debts.status, 'active') : undefined, personId ? eq(debts.personId, personId) : undefined))
        .all();
    const totals = legTotals(rows.map((d) => d.id));
    return rows.map((d) => ({ debt: d, state: computeDebtState(d, totals.get(d.id)) }));
}

export function getDebt(userId: string, debtId: string, client: Tx | typeof db = db) {
    return client.select().from(debts).where(and(eq(debts.id, debtId), eq(debts.userId, userId))).get();
}

/** Loan-linked ledger entries, newest first. */
export function debtLedger(userId: string, debtId: string) {
    const t = transactions;
    return db
        .select({
            id: t.id,
            role: t.debtRole,
            amountMinor: t.amountMinor,
            occurredOn: t.occurredOn,
            status: t.status,
            title: t.title,
            accountName: accounts.name,
        })
        .from(t)
        .innerJoin(accounts, eq(accounts.id, t.accountId))
        .where(and(eq(t.userId, userId), eq(t.debtId, debtId)))
        .orderBy(desc(t.occurredOn), desc(t.createdAt))
        .all();
}

/**
 * Keeps the status in line with the ledger: settled once repayments clear the
 * loan, reopened if one of those repayments is reversed or deleted. Loans
 * settled by hand (or before this was tracked) are never reopened.
 */
export function syncDebtStatus(userId: string, debtId: string, client: Tx | typeof db = db) {
    const debt = getDebt(userId, debtId, client);
    if (!debt || debt.status === 'cancelled') return;
    const state = debtState(debt, client);

    if (debt.status === 'active' && state.outstanding === 0 && state.repaid > 0) {
        const last = client
            .select({ on: sql<string>`max(${transactions.occurredOn})` })
            .from(transactions)
            .where(and(eq(transactions.debtId, debtId), eq(transactions.status, 'active')))
            .get();
        client.update(debts).set({ status: 'paid', settledBy: 'ledger', paidOn: last?.on ?? null }).where(eq(debts.id, debtId)).run();
    } else if (debt.status === 'paid' && debt.settledBy === 'ledger' && state.outstanding > 0) {
        client.update(debts).set({ status: 'active', settledBy: null, paidOn: null }).where(eq(debts.id, debtId)).run();
    }
}

/** True when any transaction (in any state) is linked to the loan. */
export function hasLoanEntries(debtId: string, client: Tx | typeof db = db) {
    return Boolean(client.select({ id: transactions.id }).from(transactions).where(eq(transactions.debtId, debtId)).get());
}

/** Finds or creates the category used for loan charges / interest received. */
export function chargeCategory(client: Tx, userId: string, kind: 'income' | 'expense') {
    return kind === 'expense'
        ? ensureCategory(client, userId, 'expense', 'Loan charges', '#CF4655')
        : ensureCategory(client, userId, 'income', 'Interest received', '#4AAE8C');
}

/** Finds or creates the category for bank, card and mobile money charges. */
export function feesCategory(client: Tx, userId: string) {
    return ensureCategory(client, userId, 'expense', 'Charges & fees', '#D9822B');
}

function ensureCategory(client: Tx, userId: string, kind: 'income' | 'expense', name: string, color: string) {
    const c = categories;
    const existing = client
        .select({ id: c.id, archivedAt: c.archivedAt })
        .from(c)
        .where(and(eq(c.userId, userId), eq(c.kind, kind), eq(c.name, name)))
        .get();
    if (existing) {
        if (existing.archivedAt) client.update(c).set({ archivedAt: null }).where(eq(c.id, existing.id)).run();
        return existing.id;
    }
    return client
        .insert(c)
        .values({ userId, kind, name, color })
        .returning({ id: c.id })
        .get().id;
}

/**
 * Records the money borrowed (into the account) or lent (out of it). An
 * upfront fee is recorded as a separate expense so the account moves by the
 * amount actually received.
 */
export function insertDisbursement(client: Tx, debt: Debt, accountId: string, occurredOn: string) {
    const principal = Math.min(debt.principalMinor ?? debt.amountMinor, debt.amountMinor);
    const borrowing = debt.direction === 'owed';
    const base = { userId: debt.userId, accountId, debtId: debt.id, personId: debt.personId, occurredOn, metadata: { group: crypto.randomUUID() } };

    client.insert(transactions)
        .values({
            ...base,
            kind: 'debt',
            debtRole: 'disbursement',
            amountMinor: borrowing ? principal : -principal,
            title: borrowing ? `Loan received: ${debt.title}` : `Lent: ${debt.title}`,
        })
        .run();

    if (borrowing && debt.upfrontFeeMinor > 0) {
        client.insert(transactions)
            .values({
                ...base,
                kind: 'expense',
                debtRole: 'fee',
                amountMinor: -debt.upfrontFeeMinor,
                categoryId: chargeCategory(client, debt.userId, 'expense'),
                title: `Loan fee: ${debt.title}`,
            })
            .run();
    }
}

export function insertRepayment(client: Tx, debt: Debt, accountId: string, amount: number, occurredOn: string, note: string | null) {
    const state = debtState(debt, client);
    const { principal, interest } = splitRepayment(amount, state);
    const borrowing = debt.direction === 'owed';
    const sign = borrowing ? -1 : 1;
    const base = { userId: debt.userId, accountId, debtId: debt.id, personId: debt.personId, occurredOn, note, metadata: { group: crypto.randomUUID() } };

    if (principal > 0) {
        client.insert(transactions)
            .values({
                ...base,
                kind: 'debt',
                debtRole: 'repayment',
                amountMinor: sign * principal,
                title: borrowing ? `Repayment: ${debt.title}` : `Repaid to you: ${debt.title}`,
            })
            .run();
    }
    if (interest > 0) {
        client.insert(transactions)
            .values({
                ...base,
                kind: borrowing ? 'expense' : 'income',
                debtRole: 'interest',
                amountMinor: sign * interest,
                categoryId: chargeCategory(client, debt.userId, borrowing ? 'expense' : 'income'),
                title: borrowing ? `Finance charge: ${debt.title}` : `Interest: ${debt.title}`,
            })
            .run();
    }
    syncDebtStatus(debt.userId, debt.id, client);
    return { principal, interest };
}

/**
 * Ids of the entries recorded together with this one (a loan's disbursement +
 * fee, principal + finance charge, or an expense + its charges), so they are
 * reversed, deleted and re-dated together.
 */
export function entryGroupIds(client: Tx | typeof db, row: { id: string; userId: string; metadata: Record<string, unknown> | null }) {
    const group = row.metadata?.group;
    if (typeof group !== 'string') return [row.id];
    const t = transactions;
    return client
        .select({ id: t.id })
        .from(t)
        .where(and(eq(t.userId, row.userId), sql`json_extract(${t.metadata}, '$.group') = ${group}`))
        .all()
        .map((r) => r.id);
}
