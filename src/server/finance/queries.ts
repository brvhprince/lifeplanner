import 'server-only';
import { and, asc, desc, eq, isNull, like, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db, schema } from '@/server/db';

const { accounts, categories, transactions, transfers } = schema;

const activeAmount = sql<number>`coalesce(sum(case when ${transactions.status} = 'active' then ${transactions.amountMinor} end), 0)`;

export type AccountWithBalance = Awaited<ReturnType<typeof listAccounts>>[number];

/** Accounts with their balance derived from the ledger. */
export function listAccounts(userId: string, { includeArchived = false } = {}) {
    return db
        .select({
            id: accounts.id,
            name: accounts.name,
            description: accounts.description,
            type: accounts.type,
            currency: accounts.currency,
            isPrimary: accounts.isPrimary,
            archivedAt: accounts.archivedAt,
            openingBalanceMinor: accounts.openingBalanceMinor,
            overdraftLimitMinor: accounts.overdraftLimitMinor,
            balanceMinor: sql<number>`${accounts.openingBalanceMinor} + ${activeAmount}`,
            transactionCount: sql<number>`count(${transactions.id})`,
        })
        .from(accounts)
        .leftJoin(transactions, eq(transactions.accountId, accounts.id))
        .where(and(eq(accounts.userId, userId), includeArchived ? undefined : isNull(accounts.archivedAt)))
        .groupBy(accounts.id)
        .orderBy(desc(accounts.isPrimary), asc(accounts.name))
        .all();
}

export function getAccount(userId: string, accountId: string) {
    return listAccounts(userId, { includeArchived: true }).find((a) => a.id === accountId) ?? null;
}

export function listCategories(userId: string, { includeArchived = false } = {}) {
    return db
        .select()
        .from(categories)
        .where(and(eq(categories.userId, userId), includeArchived ? undefined : isNull(categories.archivedAt)))
        .orderBy(asc(categories.kind), asc(categories.name))
        .all();
}

export type LedgerRow = ReturnType<typeof listTransactions>['rows'][number];

const counterAccount = alias(accounts, 'counter_account');
const counterLeg = alias(transactions, 'counter_leg');

export function listTransactions(
    userId: string,
    {
        accountId,
        categoryId,
        month,
        limit = 50,
        offset = 0,
    }: { accountId?: string; categoryId?: string; month?: string; limit?: number; offset?: number } = {}
) {
    const where = and(
        eq(transactions.userId, userId),
        accountId ? eq(transactions.accountId, accountId) : undefined,
        categoryId ? eq(transactions.categoryId, categoryId) : undefined,
        month ? like(transactions.occurredOn, `${month}-%`) : undefined
    );

    const rows = db
        .select({
            id: transactions.id,
            kind: transactions.kind,
            title: transactions.title,
            note: transactions.note,
            amountMinor: transactions.amountMinor,
            occurredOn: transactions.occurredOn,
            status: transactions.status,
            transferId: transactions.transferId,
            accountId: accounts.id,
            accountName: accounts.name,
            currency: accounts.currency,
            categoryName: categories.name,
            debtId: transactions.debtId,
            debtRole: transactions.debtRole,
            debtTitle: schema.debts.title,
            debtDirection: schema.debts.direction,
            categoryColor: categories.color,
            counterAccountName: counterAccount.name,
        })
        .from(transactions)
        .innerJoin(accounts, eq(accounts.id, transactions.accountId))
        .leftJoin(categories, eq(categories.id, transactions.categoryId))
        .leftJoin(schema.debts, eq(schema.debts.id, transactions.debtId))
        .leftJoin(
            counterLeg,
            and(
                eq(counterLeg.transferId, transactions.transferId),
                sql`${counterLeg.id} <> ${transactions.id}`
            )
        )
        .leftJoin(counterAccount, eq(counterAccount.id, counterLeg.accountId))
        .where(where)
        .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt))
        .limit(limit + 1)
        .offset(offset)
        .all();

    return { rows: rows.slice(0, limit), hasMore: rows.length > limit };
}

/** Income and expense totals per currency for a month (transfers excluded). */
export function monthTotals(userId: string, month: string) {
    return db
        .select({
            currency: accounts.currency,
            kind: transactions.kind,
            totalMinor: sql<number>`sum(${transactions.amountMinor})`,
        })
        .from(transactions)
        .innerJoin(accounts, eq(accounts.id, transactions.accountId))
        .where(
            and(
                eq(transactions.userId, userId),
                eq(transactions.status, 'active'),
                sql`${transactions.kind} in ('income', 'expense')`,
                like(transactions.occurredOn, `${month}-%`)
            )
        )
        .groupBy(accounts.currency, transactions.kind)
        .all();
}

/** Expense totals per category for a month, largest first. */
export function spendingByCategory(userId: string, month: string) {
    return db
        .select({
            categoryId: transactions.categoryId,
            name: sql<string>`coalesce(${categories.name}, 'Uncategorised')`,
            color: categories.color,
            currency: accounts.currency,
            totalMinor: sql<number>`-sum(${transactions.amountMinor})`,
        })
        .from(transactions)
        .innerJoin(accounts, eq(accounts.id, transactions.accountId))
        .leftJoin(categories, eq(categories.id, transactions.categoryId))
        .where(
            and(
                eq(transactions.userId, userId),
                eq(transactions.status, 'active'),
                eq(transactions.kind, 'expense'),
                like(transactions.occurredOn, `${month}-%`)
            )
        )
        .groupBy(transactions.categoryId, accounts.currency)
        .orderBy(sql`sum(${transactions.amountMinor}) asc`)
        .all();
}

export function getTransfer(userId: string, transferId: string) {
    return db
        .select()
        .from(transfers)
        .where(and(eq(transfers.userId, userId), eq(transfers.id, transferId)))
        .get();
}
