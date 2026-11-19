'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/server/db';
import { requireUser } from '@/server/auth/session';
import { formValues, parseForm, type ActionState } from '@/lib/action-state';
import { formatMoney, isCurrency, toMinor } from '@/lib/money';
import { getAccount } from '@/server/finance/queries';
import { ownsRecord } from '@/server/ownership';
import { isIsoDate } from '@/lib/dates';
import { ACCOUNT_TYPES } from '@/server/db/schema';
import { deleteEntityFiles } from '@/server/files';
import { debtState, entryGroupIds, feesCategory, getDebt, syncDebtStatus, type Tx } from '@/server/finance/debts';

const { accounts, categories, transactions, transfers } = schema;

const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .transform((v) => v || null)
        .optional();

const isoDate = z.string().refine(isIsoDate, 'Enter a valid date');

function fieldError(formData: FormData, field: string, message: string): ActionState {
    return { error: message, fieldErrors: { [field]: message }, values: formValues(formData) };
}

function refresh() {
    revalidatePath('/', 'layout');
}

/** Tells the user when an entry pushed an account below zero. */
function overdraftNote(userId: string, accountId: string) {
    const account = getAccount(userId, accountId);
    if (!account || account.balanceMinor >= 0) return '';
    const used = -account.balanceMinor;
    const limit = account.overdraftLimitMinor;
    if (limit > 0 && used <= limit) {
        return `. ${account.name} is using ${formatMoney(used, account.currency)} of its ${formatMoney(limit, account.currency)} overdraft`;
    }
    const over = limit > 0 ? used - limit : used;
    return `. ${account.name} is ${formatMoney(over, account.currency)} over ${limit > 0 ? 'its overdraft limit' : 'its balance'}`;
}

function ownedAccount(userId: string, accountId: string) {
    return db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId), isNull(accounts.archivedAt)))
        .get();
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

/** Digits only; spaces and dashes typed for readability are dropped. */
const accountNumber = optionalText(40)
    .transform((v) => v?.replace(/[\s-]/g, '') || undefined)
    .refine((v) => !v || /^\d+$/.test(v), 'Use digits only');

const accountSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    type: z.enum(ACCOUNT_TYPES, 'Choose an account type'),
    currency: z.string().trim().toUpperCase().refine(isCurrency, 'Choose a valid currency'),
    openingBalance: z.string().trim().default('0'),
    overdraftLimit: z.string().trim().default(''),
    description: optionalText(500),
    institution: optionalText(100),
    accountNumber: accountNumber,
    isPrimary: z.literal('on').optional(),
});

/** Parses the optional overdraft limit; returns null when invalid. */
function parseOverdraft(value: string, currency: string) {
    if (!value) return 0;
    const minor = toMinor(value, currency);
    return minor === null || minor < 0 ? null : minor;
}

export async function createAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const parsed = parseForm(accountSchema, formData);
    if (!parsed.data) return parsed.state;
    const { openingBalance, overdraftLimit, isPrimary, ...data } = parsed.data;

    const openingBalanceMinor = toMinor(openingBalance || '0', data.currency);
    if (openingBalanceMinor === null) return fieldError(formData, 'openingBalance', 'Enter a valid amount');
    const overdraftLimitMinor = parseOverdraft(overdraftLimit, data.currency);
    if (overdraftLimitMinor === null) return fieldError(formData, 'overdraftLimit', 'Enter a valid limit');

    db.transaction((tx) => {
        const hasAccounts = tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, user.id)).get();
        const primary = Boolean(isPrimary) || !hasAccounts;
        if (primary) {
            tx.update(accounts).set({ isPrimary: false }).where(eq(accounts.userId, user.id)).run();
        }
        tx.insert(accounts)
            .values({ ...data, userId: user.id, openingBalanceMinor, overdraftLimitMinor, isPrimary: primary })
            .run();
    });

    refresh();
    return { ok: true, message: `Account “${data.name}” created` };
}

export async function makePrimaryAccount(accountId: string) {
    const user = await requireUser();
    if (!ownedAccount(user.id, accountId)) return;
    db.transaction((tx) => {
        tx.update(accounts).set({ isPrimary: false }).where(eq(accounts.userId, user.id)).run();
        tx.update(accounts)
            .set({ isPrimary: true })
            .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)))
            .run();
    });
    refresh();
}

export async function setAccountArchived(accountId: string, archived: boolean) {
    const user = await requireUser();
    db.update(accounts)
        .set({ archivedAt: archived ? new Date() : null, ...(archived ? { isPrimary: false } : {}) })
        .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)))
        .run();
    refresh();
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categorySchema = z.object({
    kind: z.enum(['income', 'expense'], 'Choose income or expense'),
    name: z.string().trim().min(1, 'Name is required').max(60),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional()
        .or(z.literal('').transform(() => undefined)),
});

export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const parsed = parseForm(categorySchema, formData);
    if (!parsed.data) return parsed.state;

    const duplicate = db
        .select({ id: categories.id, archivedAt: categories.archivedAt })
        .from(categories)
        .where(
            and(
                eq(categories.userId, user.id),
                eq(categories.kind, parsed.data.kind),
                eq(categories.name, parsed.data.name)
            )
        )
        .get();

    if (duplicate?.archivedAt) {
        db.update(categories).set({ archivedAt: null, color: parsed.data.color }).where(eq(categories.id, duplicate.id)).run();
    } else if (duplicate) {
        return fieldError(formData, 'name', 'A category with this name already exists');
    } else {
        db.insert(categories).values({ ...parsed.data, userId: user.id }).run();
    }

    refresh();
    return { ok: true, message: `Category “${parsed.data.name}” saved` };
}

export async function archiveCategory(categoryId: string) {
    const user = await requireUser();
    db.update(categories)
        .set({ archivedAt: new Date() })
        .where(and(eq(categories.id, categoryId), eq(categories.userId, user.id)))
        .run();
    refresh();
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

const entrySchema = z.object({
    kind: z.enum(['income', 'expense', 'transfer']),
    accountId: z.string().min(1, 'Choose an account'),
    amount: z.string().trim().min(1, 'Amount is required'),
    title: z.string().trim().max(120).default(''),
    occurredOn: isoDate,
    note: optionalText(1000),
    categoryId: z.string().optional(),
    toAccountId: z.string().optional(),
    toAmount: z.string().trim().optional(),
    fee: z.string().trim().optional(),
    personId: z.string().optional(),
});

/** Charges in minor units: 0 when empty, null when invalid. */
function parseCharges(value: string | undefined, currency: string) {
    if (!value) return 0;
    const minor = toMinor(value, currency);
    return minor === null || minor < 0 ? null : minor;
}

/** An expense entry for bank, card or mobile money charges on another entry. */
function chargeEntry(tx: Tx, userId: string, accountId: string, amountMinor: number, title: string, occurredOn: string, group: string | null) {
    return {
        userId,
        accountId,
        kind: 'expense' as const,
        amountMinor: -amountMinor,
        categoryId: feesCategory(tx, userId),
        title: `Charges: ${title}`,
        occurredOn,
        metadata: { ...(group ? { group } : {}), charge: true },
    };
}

const isCharge = (row: { metadata: Record<string, unknown> | null }) => row.metadata?.charge === true;

/** The charges entry recorded with an expense, if any. */
function chargeOf(client: Tx | typeof db, row: typeof transactions.$inferSelect) {
    const ids = entryGroupIds(client, row).filter((id) => id !== row.id);
    if (!ids.length) return undefined;
    return client
        .select()
        .from(transactions)
        .where(inArray(transactions.id, ids))
        .all()
        .find(isCharge);
}

/** The person id if it belongs to the user, null when empty, undefined when invalid. */
function ownedPerson(userId: string, personId: string | undefined) {
    if (!personId) return null;
    return ownsRecord(schema.relationships, userId, personId) ? personId : undefined;
}

export async function createEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const parsed = parseForm(entrySchema, formData);
    if (!parsed.data) return parsed.state;
    const input = parsed.data;

    const account = ownedAccount(user.id, input.accountId);
    if (!account) return fieldError(formData, 'accountId', 'Choose an account');

    const amountMinor = toMinor(input.amount, account.currency);
    if (amountMinor === null || amountMinor <= 0) {
        return fieldError(formData, 'amount', 'Enter an amount greater than zero');
    }

    if (input.kind === 'transfer') {
        return createTransfer(user.id, account, amountMinor, input, formData);
    }

    let categoryId: string | null = null;
    if (input.categoryId) {
        const category = db
            .select()
            .from(categories)
            .where(and(eq(categories.id, input.categoryId), eq(categories.userId, user.id)))
            .get();
        if (!category || category.kind !== input.kind) {
            return fieldError(formData, 'categoryId', 'Choose a matching category');
        }
        categoryId = category.id;
    }

    const personId = ownedPerson(user.id, input.personId);
    if (personId === undefined) return fieldError(formData, 'personId', 'Choose someone from your People');

    const chargesMinor = input.kind === 'expense' ? parseCharges(input.fee, account.currency) : 0;
    if (chargesMinor === null) return fieldError(formData, 'fee', 'Enter a valid amount for the charges');

    const title = input.title || (input.kind === 'income' ? 'Income' : 'Expense');
    db.transaction((tx) => {
        const group = chargesMinor ? { group: crypto.randomUUID() } : null;
        tx.insert(transactions)
            .values({
                userId: user.id,
                accountId: account.id,
                kind: input.kind,
                amountMinor: input.kind === 'expense' ? -amountMinor : amountMinor,
                categoryId,
                personId,
                title,
                note: input.note ?? null,
                occurredOn: input.occurredOn,
                metadata: group,
            })
            .run();
        if (group) tx.insert(transactions).values(chargeEntry(tx, user.id, account.id, chargesMinor, title, input.occurredOn, group.group)).run();
    });

    refresh();
    return { ok: true, message: `${input.kind === 'income' ? 'Income' : 'Expense'} recorded${overdraftNote(user.id, account.id)}` };
}

function createTransfer(
    userId: string,
    from: typeof accounts.$inferSelect,
    fromAmountMinor: number,
    input: z.infer<typeof entrySchema>,
    formData: FormData
): ActionState {
    if (!input.toAccountId) return fieldError(formData, 'toAccountId', 'Choose the destination account');
    if (input.toAccountId === from.id) return fieldError(formData, 'toAccountId', 'Choose a different account');

    const to = ownedAccount(userId, input.toAccountId);
    if (!to) return fieldError(formData, 'toAccountId', 'Choose the destination account');

    let toAmountMinor = fromAmountMinor;
    if (to.currency !== from.currency) {
        const parsed = input.toAmount ? toMinor(input.toAmount, to.currency) : null;
        if (parsed === null || parsed <= 0) {
            return fieldError(formData, 'toAmount', `Enter the amount received in ${to.currency}`);
        }
        toAmountMinor = parsed;
    }

    const feeMinor = parseCharges(input.fee, from.currency);
    if (feeMinor === null) return fieldError(formData, 'fee', 'Enter a valid amount for the charges');

    const title = input.title || `Transfer to ${to.name}`;

    db.transaction((tx) => {
        const transfer = tx
            .insert(transfers)
            .values({
                userId,
                fromAccountId: from.id,
                toAccountId: to.id,
                fromAmountMinor,
                toAmountMinor,
                feeMinor,
                title,
                note: input.note ?? null,
                occurredOn: input.occurredOn,
            })
            .returning({ id: transfers.id })
            .get();

        const leg = { userId, kind: 'transfer' as const, transferId: transfer.id, note: input.note ?? null, occurredOn: input.occurredOn };
        tx.insert(transactions)
            .values([
                { ...leg, accountId: from.id, amountMinor: -fromAmountMinor, title },
                { ...leg, accountId: to.id, amountMinor: toAmountMinor, title: input.title || `Transfer from ${from.name}` },
            ])
            .run();
        // The charges count as spending, so they're an expense entry of their own
        // (part of the transfer: reversed and deleted with it).
        if (feeMinor) {
            tx.insert(transactions)
                .values({ ...chargeEntry(tx, userId, from.id, feeMinor, title, input.occurredOn, null), transferId: transfer.id, note: input.note ?? null })
                .run();
        }
    });

    refresh();
    return { ok: true, message: `Transfer recorded${overdraftNote(userId, from.id)}` };
}

/**
 * Why restoring a reversed loan entry would double-count money, or null if it's
 * fine: e.g. a replacement repayment was recorded after this one was reversed.
 */
function loanRestoreProblem(userId: string, row: typeof transactions.$inferSelect) {
    const debt = getDebt(userId, row.debtId!);
    if (!debt) return null;
    const legs = db
        .select({ role: transactions.debtRole, amountMinor: transactions.amountMinor })
        .from(transactions)
        .where(inArray(transactions.id, entryGroupIds(db, row)))
        .all();
    const state = debtState(debt);
    if (legs.some((l) => l.role === 'disbursement') && state.disbursed) return 'restore-disbursement';
    const repaying = legs.filter((l) => l.role === 'repayment' || l.role === 'interest').reduce((sum, l) => sum + Math.abs(l.amountMinor), 0);
    if (repaying > state.outstanding) return 'restore-overpay';
    return null;
}

/** Marks a ledger entry (and its transfer counterpart) reversed; history is kept. */
export async function setTransactionReversed(transactionId: string, reversed: boolean) {
    const user = await requireUser();
    const row = db
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)))
        .get();
    if (!row) return;

    const status = reversed ? 'reversed' : 'active';
    if (!reversed && row.debtId) {
        const blocked = loanRestoreProblem(user.id, row);
        if (blocked) redirect(`/transactions/${row.id}?notice=${blocked}`);
    }
    db.transaction((tx) => {
        if (row.transferId) {
            tx.update(transfers).set({ status }).where(eq(transfers.id, row.transferId)).run();
            tx.update(transactions).set({ status }).where(eq(transactions.transferId, row.transferId)).run();
        } else {
            tx.update(transactions).set({ status }).where(inArray(transactions.id, entryGroupIds(tx, row))).run();
            if (row.debtId) syncDebtStatus(user.id, row.debtId, tx);
        }
    });
    refresh();
}

// ---------------------------------------------------------------------------
// Editing
// ---------------------------------------------------------------------------

const accountUpdateSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    type: z.enum(ACCOUNT_TYPES, 'Choose an account type'),
    currency: z.string().trim().toUpperCase().refine(isCurrency, 'Choose a valid currency'),
    openingBalance: z.string().trim().default('0'),
    overdraftLimit: z.string().trim().default(''),
    description: optionalText(500),
    institution: optionalText(100),
    accountNumber: accountNumber,
});

export async function updateAccount(accountId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const account = db.select().from(accounts).where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id))).get();
    if (!account) return { error: 'Account not found' };

    const parsed = parseForm(accountUpdateSchema, formData);
    if (!parsed.data) return parsed.state;
    const { openingBalance, overdraftLimit, ...data } = parsed.data;

    if (data.currency !== account.currency) {
        const used = db.select({ id: transactions.id }).from(transactions).where(eq(transactions.accountId, accountId)).get();
        if (used) return fieldError(formData, 'currency', 'The currency can’t change once the account has entries');
    }
    const openingBalanceMinor = toMinor(openingBalance || '0', data.currency);
    if (openingBalanceMinor === null) return fieldError(formData, 'openingBalance', 'Enter a valid amount');

    const overdraftLimitMinor = parseOverdraft(overdraftLimit, data.currency);
    if (overdraftLimitMinor === null) return fieldError(formData, 'overdraftLimit', 'Enter a valid limit');

    db.update(accounts)
        .set({
            ...data,
            description: data.description ?? null,
            institution: data.institution ?? null,
            accountNumber: data.accountNumber ?? null,
            openingBalanceMinor,
            overdraftLimitMinor,
        })
        .where(eq(accounts.id, accountId))
        .run();
    refresh();
    return { ok: true, message: 'Account updated' };
}

export async function deleteAccount(accountId: string) {
    const user = await requireUser();
    const used = db.select({ id: transactions.id }).from(transactions).where(eq(transactions.accountId, accountId)).get();
    // Accounts with history are archived instead, so balances elsewhere stay correct.
    if (used) return setAccountArchived(accountId, true);
    db.delete(accounts).where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id))).run();
    refresh();
    redirect('/accounts');
}

export async function updateCategory(categoryId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const name = String(formData.get('name') ?? '').trim();
    const color = String(formData.get('color') ?? '');
    if (!name || name.length > 60) return fieldError(formData, 'name', 'Enter a name');
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) return fieldError(formData, 'color', 'Pick a colour');

    try {
        db.update(categories)
            .set({ name, color: color || null })
            .where(and(eq(categories.id, categoryId), eq(categories.userId, user.id)))
            .run();
    } catch {
        return fieldError(formData, 'name', 'A category with this name already exists');
    }
    refresh();
    return { ok: true, message: 'Category updated' };
}

export async function restoreCategory(categoryId: string) {
    const user = await requireUser();
    db.update(categories).set({ archivedAt: null }).where(and(eq(categories.id, categoryId), eq(categories.userId, user.id))).run();
    refresh();
}

const entryUpdateSchema = z.object({
    fee: z.string().trim().optional(),
    title: z.string().trim().min(1, 'Description is required').max(120),
    occurredOn: isoDate,
    note: optionalText(1000),
    amount: z.string().trim().optional(),
    accountId: z.string().optional(),
    categoryId: z.string().optional(),
    personId: z.string().optional(),
});

/** Edits a ledger entry. Transfers only allow title, date and note (both legs). */
export async function updateEntry(transactionId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const row = db.select().from(transactions).where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id))).get();
    if (!row) return { error: 'Entry not found' };

    const parsed = parseForm(entryUpdateSchema, formData);
    if (!parsed.data) return parsed.state;
    const input = parsed.data;

    if (row.debtId || row.kind === 'debt') {
        // Loan entries (including ones whose loan was deleted): amounts and
        // accounts are managed from the loan, so only details change here.
        db.transaction((tx) => {
            tx.update(transactions)
                .set({ occurredOn: input.occurredOn, note: input.note ?? null })
                .where(inArray(transactions.id, entryGroupIds(tx, row)))
                .run();
            tx.update(transactions).set({ title: input.title }).where(eq(transactions.id, row.id)).run();
            if (row.debtId) syncDebtStatus(user.id, row.debtId, tx);
        });
        refresh();
        return { ok: true, message: 'Entry updated' };
    }

    if (isCharge(row) && !row.transferId) {
        // Charges follow their expense: amount and account are set there.
        db.transaction((tx) => {
            tx.update(transactions).set({ occurredOn: input.occurredOn }).where(inArray(transactions.id, entryGroupIds(tx, row))).run();
            tx.update(transactions).set({ title: input.title, note: input.note ?? null }).where(eq(transactions.id, row.id)).run();
        });
        refresh();
        return { ok: true, message: 'Charges updated' };
    }

    if (row.transferId) {
        const shared = { occurredOn: input.occurredOn, note: input.note ?? null };
        db.transaction((tx) => {
            // The charges entry has its own description; it doesn't rename the transfer.
            tx.update(transfers)
                .set(isCharge(row) ? shared : { ...shared, title: input.title })
                .where(eq(transfers.id, row.transferId!))
                .run();
            tx.update(transactions).set(shared).where(eq(transactions.transferId, row.transferId!)).run();
            tx.update(transactions).set({ title: input.title }).where(eq(transactions.id, row.id)).run();
        });
        refresh();
        return { ok: true, message: 'Transfer updated' };
    }

    const account = ownedAccount(user.id, input.accountId || row.accountId);
    if (!account) return fieldError(formData, 'accountId', 'Choose an active account');

    const amountMinor = toMinor(input.amount ?? '', account.currency);
    if (amountMinor === null || amountMinor <= 0) return fieldError(formData, 'amount', 'Enter an amount greater than zero');

    let categoryId: string | null = null;
    if (input.categoryId) {
        const category = db.select().from(categories).where(and(eq(categories.id, input.categoryId), eq(categories.userId, user.id))).get();
        if (!category || category.kind !== row.kind) return fieldError(formData, 'categoryId', 'Choose a matching category');
        categoryId = category.id;
    }

    const personId = ownedPerson(user.id, input.personId);
    if (personId === undefined) return fieldError(formData, 'personId', 'Choose someone from your People');

    const chargesMinor = row.kind === 'expense' ? parseCharges(input.fee, account.currency) : 0;
    if (chargesMinor === null) return fieldError(formData, 'fee', 'Enter a valid amount for the charges');
    const removedCharge = db.transaction((tx) => {
        const charge = chargeOf(tx, row);
        const group = typeof row.metadata?.group === 'string' ? row.metadata.group : chargesMinor ? crypto.randomUUID() : null;
        tx.update(transactions)
            .set({
                title: input.title,
                occurredOn: input.occurredOn,
                note: input.note ?? null,
                accountId: account.id,
                categoryId,
                personId,
                amountMinor: row.kind === 'expense' ? -amountMinor : amountMinor,
                metadata: group ? { ...row.metadata, group } : row.metadata,
            })
            .where(eq(transactions.id, row.id))
            .run();
        if (charge && chargesMinor) {
            tx.update(transactions)
                .set({ amountMinor: -chargesMinor, accountId: account.id, occurredOn: input.occurredOn })
                .where(eq(transactions.id, charge.id))
                .run();
        } else if (charge) {
            tx.delete(transactions).where(eq(transactions.id, charge.id)).run();
            return charge.id;
        } else if (chargesMinor && group) {
            tx.insert(transactions)
                .values({ ...chargeEntry(tx, user.id, account.id, chargesMinor, input.title, input.occurredOn, group), status: row.status })
                .run();
        }
        return null;
    });
    // Receipts of removed charges, once their entry is gone.
    if (removedCharge) await deleteEntityFiles(user.id, 'transaction', [removedCharge]);
    refresh();
    return { ok: true, message: 'Entry updated' };
}

/** Permanently removes an entry (and the other leg of a transfer). */
export async function deleteEntry(transactionId: string) {
    const user = await requireUser();
    const row = db.select().from(transactions).where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id))).get();
    if (row) {
        // Everything recorded with the entry is found and deleted in one
        // transaction; their receipts are removed afterwards.
        const legs = db.transaction((tx) => {
            const ids = row.transferId
                ? tx.select({ id: transactions.id }).from(transactions).where(eq(transactions.transferId, row.transferId)).all().map((l) => l.id)
                : entryGroupIds(tx, row);
            if (row.transferId) tx.delete(transfers).where(eq(transfers.id, row.transferId)).run();
            else tx.delete(transactions).where(inArray(transactions.id, ids)).run();
            if (row.debtId) syncDebtStatus(user.id, row.debtId, tx);
            return ids;
        });
        await deleteEntityFiles(user.id, 'transaction', legs);
    }
    refresh();
    redirect('/transactions');
}
