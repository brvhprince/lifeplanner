'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { requireUser } from '@/server/auth/session';
import { getModule, statusOf } from '@/lib/modules/definitions';
import { formValues, type ActionState } from '@/lib/action-state';
import { addPeriod, isIsoDate, today } from '@/lib/dates';
import { formatMoney, toMinor } from '@/lib/money';
import { getRecord, tableFor } from './registry';
import { parseRecord } from './validate';
import { deleteEntityFiles } from '@/server/files';
import { isHttpUrl, isPhone } from '@/lib/validate';
import { chargeCategory, debtState, getDebt, hasLoanEntries, insertDisbursement, insertRepayment, syncDebtStatus } from '@/server/finance/debts';

function moduleOrThrow(key: string) {
    const def = getModule(key);
    if (!def) throw new Error(`Unknown module: ${key}`);
    return def;
}

function refresh(key: string, id?: string) {
    revalidatePath(`/${key}`);
    if (id) revalidatePath(`/${key}/${id}`);
    revalidatePath('/');
}

/** Creates (`id` null) or updates a record of any module. */
export async function saveRecord(moduleKey: string, id: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const def = moduleOrThrow(moduleKey);
    const { table, columns } = tableFor(def);

    const parsed = parseRecord(def, columns, formData, { userId: user.id, defaultCurrency: user.currency });
    if (!parsed.values) return parsed.state;
    const values = parsed.values;

    const status = String(formData.get('status') ?? '');
    if (def.statuses && status) {
        if (!statusOf(def, status)) return { error: 'Choose a valid status', values: formValues(formData) };
        values.status = status;
    }

    const recordNow = def.key === 'debts' && !id && formData.get('recordNow') === 'on';
    if (def.key === 'debts') {
        const problem = (id && checkDebtUpdate(values, user.id, id)) || checkDebtValues(values, user.id, recordNow);
        if (problem) return { ...problem, values: formValues(formData) };
    }

    if (id) {
        if (!getRecord(def, user.id, id)) return { error: `That ${def.singular.toLowerCase()} no longer exists` };
        db.transaction((tx) => {
            tx.update(table).set(values as never).where(and(eq(columns.id, id), eq(columns.userId, user.id))).run();
            if (def.key === 'debts') syncDebtStatus(user.id, id, tx);
        });
        refresh(def.key, id);
        return { ok: true, message: 'Saved' };
    }

    if (def.statuses && !values.status && def.defaultStatus) values.status = def.defaultStatus;
    db.transaction((tx) => {
        const row = tx
            .insert(table)
            .values({ ...values, userId: user.id } as never)
            .returning()
            .get() as unknown as typeof schema.debts.$inferSelect;
        if (recordNow) insertDisbursement(tx, row, row.accountId!, row.startedOn ?? today());
    });
    if (recordNow) revalidatePath('/', 'layout');
    refresh(def.key);
    return { ok: true, message: recordNow ? `${def.singular} added and recorded in the account` : `${def.singular} added` };
}

const LOCKED_MESSAGE = 'Locked because money is recorded for this loan. Delete its money movements first to change it.';

/**
 * Rules for editing an existing loan: once money is recorded, the fields that
 * money depends on are fixed, the total can't drop below what's repaid, and
 * changing the status by hand is remembered as a manual settlement.
 * May adjust `values` (fills an unchanged principal, sets settledBy).
 */
function checkDebtUpdate(values: Record<string, unknown>, userId: string, id: string): ActionState | null {
    const existing = getDebt(userId, id);
    if (!existing) return null;
    const fail = (field: string, message: string) => ({ error: message, fieldErrors: { [field]: message } });

    if (hasLoanEntries(id)) {
        if (values.direction !== existing.direction) return fail('direction', LOCKED_MESSAGE);
        if (values.currency !== existing.currency) return fail('currency', LOCKED_MESSAGE);
        if (((values.upfrontFeeMinor as number | undefined) ?? 0) !== existing.upfrontFeeMinor) return fail('upfrontFeeMinor', LOCKED_MESSAGE);

        // An empty "amount borrowed" means "same as the total"; with money
        // recorded, keep the principal fixed so a new total only changes charges.
        const recordedPrincipal = Math.min(existing.principalMinor ?? existing.amountMinor, existing.amountMinor);
        if (values.principalMinor == null) values.principalMinor = recordedPrincipal;
        else if (values.principalMinor !== recordedPrincipal) return fail('principalMinor', LOCKED_MESSAGE);

        const { repaid } = debtState(existing);
        if ((values.amountMinor as number) < repaid) {
            return fail('amountMinor', `Can’t be less than the ${formatMoney(repaid, existing.currency)} already repaid`);
        }
    }

    if (values.status === 'paid' && existing.status !== 'paid') values.settledBy = 'manual';
    else if (values.status && values.status !== 'paid') values.settledBy = null;
    return null;
}

/** Cross-field checks for loans that the generic field validation can't express. */
function checkDebtValues(values: Record<string, unknown>, userId: string, recordNow: boolean): ActionState | null {
    const total = values.amountMinor as number;
    const principal = (values.principalMinor as number | null | undefined) ?? total;
    const fee = (values.upfrontFeeMinor as number | undefined) ?? 0;
    const lend = values.direction === 'lent';
    const fail = (field: string, message: string) => ({ error: message, fieldErrors: { [field]: message } });

    if (principal > total) return fail('principalMinor', 'Can’t be more than the total to repay');
    if (fee >= principal) return fail('upfrontFeeMinor', 'Fees must be less than the amount borrowed');
    if (lend && fee > 0) return fail('upfrontFeeMinor', 'Upfront fees only apply to money you borrow');

    if (recordNow) {
        const accountId = values.accountId as string | null | undefined;
        if (!accountId) return fail('accountId', 'Choose the account to record the money in');
        const account = db.select().from(schema.accounts).where(and(eq(schema.accounts.id, accountId), eq(schema.accounts.userId, userId))).get();
        if (!account || account.archivedAt) return fail('accountId', 'Choose an active account');
        if (account.currency !== values.currency) return fail('accountId', `This account is in ${account.currency}; the loan is in ${values.currency}`);
    }
    return null;
}

export async function setRecordStatus(moduleKey: string, id: string, status: string) {
    const user = await requireUser();
    const def = moduleOrThrow(moduleKey);
    if (!statusOf(def, status)) return;
    const { table, columns } = tableFor(def);
    db.update(table).set({ status } as never).where(and(eq(columns.id, id), eq(columns.userId, user.id))).run();
    refresh(def.key, id);
}

export async function deleteRecord(moduleKey: string, id: string) {
    const user = await requireUser();
    const def = moduleOrThrow(moduleKey);
    const { table, columns } = tableFor(def);
    if (!getRecord(def, user.id, id)) redirect(`/${def.key}`);
    await deleteEntityFiles(user.id, def.key, [id]);
    db.transaction((tx) => {
        tx.delete(table).where(and(eq(columns.id, id), eq(columns.userId, user.id))).run();
        const t = schema.timelineEntries;
        tx.delete(t).where(and(eq(t.userId, user.id), eq(t.entityType, def.key), eq(t.entityId, id))).run();
    });
    refresh(def.key);
    redirect(`/${def.key}`);
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export async function addTimelineEntry(moduleKey: string, entityId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const def = moduleOrThrow(moduleKey);
    if (!getRecord(def, user.id, entityId)) return { error: 'Record not found' };

    const title = String(formData.get('title') ?? '').trim();
    const body = String(formData.get('body') ?? '').trim();
    const date = String(formData.get('occurredOn') ?? '') || today();
    if (!title) return { error: 'Write something first', fieldErrors: { title: 'Required' }, values: formValues(formData) };
    if (title.length > 300 || body.length > 10_000) return { error: 'That entry is too long', values: formValues(formData) };
    if (!isIsoDate(date)) return { fieldErrors: { occurredOn: 'Enter a valid date' }, error: 'Enter a valid date', values: formValues(formData) };

    // Keep same-day entries in the order they were written.
    const occurredAt = date === today() ? new Date() : new Date(`${date}T12:00:00`);
    db.insert(schema.timelineEntries)
        .values({ userId: user.id, entityType: def.key, entityId, title, body: body || null, occurredAt })
        .run();
    refresh(def.key, entityId);
    return { ok: true, message: 'Added to log' };
}

export async function deleteTimelineEntry(moduleKey: string, entryId: string) {
    const user = await requireUser();
    const t = schema.timelineEntries;
    const entry = db.select().from(t).where(and(eq(t.id, entryId), eq(t.userId, user.id))).get();
    if (!entry) return;
    db.delete(t).where(eq(t.id, entryId)).run();
    refresh(moduleKey, entry.entityId);
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function addGoalContribution(goalId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const goal = getRecord(moduleOrThrow('goals'), user.id, goalId);
    if (!goal) return { error: 'Goal not found' };

    const amountMinor = toMinor(String(formData.get('amount') ?? ''), String(goal.currency));
    const occurredOn = String(formData.get('occurredOn') ?? '') || today();
    const note = String(formData.get('note') ?? '').trim() || null;
    if (amountMinor === null || amountMinor === 0) {
        return { error: 'Enter an amount (negative to withdraw)', fieldErrors: { amount: 'Enter an amount' }, values: formValues(formData) };
    }
    if (!isIsoDate(occurredOn)) return { error: 'Enter a valid date', fieldErrors: { occurredOn: 'Enter a valid date' }, values: formValues(formData) };

    db.insert(schema.goalContributions).values({ userId: user.id, goalId, amountMinor, occurredOn, note }).run();

    // Mark the goal complete once the target is reached.
    const [{ saved }] = db
        .select({ saved: sql<number>`coalesce(sum(${schema.goalContributions.amountMinor}), 0)` })
        .from(schema.goalContributions)
        .where(eq(schema.goalContributions.goalId, goalId))
        .all();
    const reached = saved >= Number(goal.targetMinor) && goal.status === 'active';
    if (reached) db.update(schema.goals).set({ status: 'completed' }).where(eq(schema.goals.id, goalId)).run();

    refresh('goals', goalId);
    return { ok: true, message: reached ? 'Goal reached! 🎉' : 'Contribution added' };
}

export async function deleteGoalContribution(goalId: string, contributionId: string) {
    const user = await requireUser();
    const c = schema.goalContributions;
    db.delete(c).where(and(eq(c.id, contributionId), eq(c.userId, user.id), eq(c.goalId, goalId))).run();
    refresh('goals', goalId);
}

// ---------------------------------------------------------------------------
// Subscriptions & bills
// ---------------------------------------------------------------------------

/** Records one payment in the ledger and moves the due date forward. */
export async function recordSubscriptionPayment(subscriptionId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const sub = db
        .select()
        .from(schema.subscriptions)
        .where(and(eq(schema.subscriptions.id, subscriptionId), eq(schema.subscriptions.userId, user.id)))
        .get();
    if (!sub) return { error: 'Not found' };
    if (!sub.accountId) return { error: 'Choose the account it is paid from (edit the details below), then try again.' };

    const account = db.select().from(schema.accounts).where(and(eq(schema.accounts.id, sub.accountId), eq(schema.accounts.userId, user.id))).get();
    if (!account || account.archivedAt) return { error: 'The linked account is missing or archived' };
    if (account.currency !== sub.currency) {
        return { error: `The account is in ${account.currency} but this is in ${sub.currency}. Record it as a transaction instead.` };
    }

    const occurredOn = String(formData.get('occurredOn') ?? '') || sub.nextDueOn || today();
    if (!isIsoDate(occurredOn)) return { error: 'Enter a valid date' };
    const amountMinor = formData.get('amount') ? toMinor(String(formData.get('amount')), sub.currency) : sub.amountMinor;
    if (amountMinor === null || amountMinor <= 0) return { error: 'Enter a valid amount', fieldErrors: { amount: 'Enter a valid amount' } };

    db.transaction((tx) => {
        tx.insert(schema.transactions)
            .values({
                userId: user.id,
                accountId: account.id,
                kind: sub.kind,
                amountMinor: sub.kind === 'expense' ? -amountMinor : amountMinor,
                categoryId: sub.categoryId,
                subscriptionId: sub.id,
                title: sub.title,
                occurredOn,
            })
            .run();
        const base = sub.nextDueOn && sub.nextDueOn > occurredOn ? sub.nextDueOn : occurredOn;
        tx.update(schema.subscriptions).set({ nextDueOn: addPeriod(base, sub.frequency) }).where(eq(schema.subscriptions.id, sub.id)).run();
    });

    revalidatePath('/', 'layout');
    return { ok: true, message: `Recorded in ${account.name}` };
}

// ---------------------------------------------------------------------------
// Debts
// ---------------------------------------------------------------------------

/** Marks a debt settled without recording money (e.g. paid outside the app, or forgiven). */
export async function settleDebt(debtId: string) {
    const user = await requireUser();
    db.update(schema.debts)
        .set({ status: 'paid', settledBy: 'manual', paidOn: today() })
        .where(and(eq(schema.debts.id, debtId), eq(schema.debts.userId, user.id)))
        .run();
    refresh('debts', debtId);
}

function loanAccount(userId: string, accountId: string, currency: string): { account?: typeof schema.accounts.$inferSelect; error?: string } {
    const account = db
        .select()
        .from(schema.accounts)
        .where(and(eq(schema.accounts.id, accountId), eq(schema.accounts.userId, userId)))
        .get();
    if (!account || account.archivedAt) return { error: 'Choose an active account' };
    if (account.currency !== currency) return { error: `That account is in ${account.currency}; this loan is in ${currency}` };
    return { account };
}

function refreshMoney(debtId: string) {
    revalidatePath('/', 'layout');
    refresh('debts', debtId);
}

/** Records the money borrowed into (or lent from) an account. */
export async function recordDebtDisbursement(debtId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const debt = getDebt(user.id, debtId);
    if (!debt) return { error: 'Loan not found' };
    if (debtState(debt).disbursed) return { error: 'The money for this loan is already recorded' };

    const occurredOn = String(formData.get('occurredOn') ?? '') || today();
    if (!isIsoDate(occurredOn)) return { error: 'Enter a valid date', fieldErrors: { occurredOn: 'Enter a valid date' } };
    const { account, error } = loanAccount(user.id, String(formData.get('accountId') ?? ''), debt.currency);
    if (!account) return { error, fieldErrors: { accountId: error! }, values: formValues(formData) };

    db.transaction((tx) => {
        insertDisbursement(tx, debt, account.id, occurredOn);
        tx.update(schema.debts)
            .set({ accountId: debt.accountId ?? account.id, startedOn: debt.startedOn ?? occurredOn })
            .where(eq(schema.debts.id, debt.id))
            .run();
    });
    refreshMoney(debt.id);
    return { ok: true, message: `Recorded in ${account.name}` };
}

/**
 * Turns money already entered as income (borrowed) or an expense (lent) into
 * this loan's disbursement, so it stops counting as income/spending.
 */
export async function linkDebtTransaction(debtId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const debt = getDebt(user.id, debtId);
    if (!debt) return { error: 'Loan not found' };
    if (debtState(debt).disbursed) return { error: 'The money for this loan is already recorded' };

    const t = schema.transactions;
    const row = db.select().from(t).where(and(eq(t.id, String(formData.get('transactionId') ?? '')), eq(t.userId, user.id))).get();
    const expectedKind = debt.direction === 'owed' ? 'income' : 'expense';
    if (!row || row.debtId || row.kind !== expectedKind || row.status !== 'active') {
        return { error: 'Choose a transaction to link', fieldErrors: { transactionId: 'Choose a transaction' } };
    }
    const { account, error } = loanAccount(user.id, row.accountId, debt.currency);
    if (!account) return { error, fieldErrors: { transactionId: error! } };

    const principal = Math.min(debt.principalMinor ?? debt.amountMinor, debt.amountMinor);
    // If the entry is the net amount after an upfront fee, split it back into
    // principal + fee so the account balance stays the same.
    const splitFee = debt.direction === 'owed' && debt.upfrontFeeMinor > 0 && row.amountMinor === principal - debt.upfrontFeeMinor;

    const group = { ...(row.metadata ?? {}), group: crypto.randomUUID() };
    db.transaction((tx) => {
        tx.update(t)
            .set({
                kind: 'debt',
                debtRole: 'disbursement',
                debtId: debt.id,
                categoryId: null,
                amountMinor: splitFee ? principal : row.amountMinor,
                metadata: group,
            })
            .where(eq(t.id, row.id))
            .run();
        if (splitFee) {
            tx.insert(t)
                .values({
                    userId: user.id,
                    accountId: row.accountId,
                    debtId: debt.id,
                    occurredOn: row.occurredOn,
                    kind: 'expense',
                    debtRole: 'fee',
                    amountMinor: -debt.upfrontFeeMinor,
                    categoryId: chargeCategory(tx, user.id, 'expense'),
                    title: `Loan fee: ${debt.title}`,
                    metadata: { group: group.group },
                })
                .run();
        }
        tx.update(schema.debts)
            .set({ accountId: debt.accountId ?? row.accountId, startedOn: debt.startedOn ?? row.occurredOn })
            .where(eq(schema.debts.id, debt.id))
            .run();
    });
    refreshMoney(debt.id);
    return { ok: true, message: `Linked “${row.title}” to this loan` };
}

/** Records a (partial) repayment, split into principal and finance charge. */
export async function recordDebtRepayment(debtId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const debt = getDebt(user.id, debtId);
    if (!debt) return { error: 'Loan not found' };
    if (debt.status !== 'active') return { error: 'This loan is not outstanding' };

    const state = debtState(debt);
    const amount = toMinor(String(formData.get('amount') ?? ''), debt.currency);
    if (amount === null || amount <= 0) return { error: 'Enter an amount', fieldErrors: { amount: 'Enter an amount' }, values: formValues(formData) };
    if (amount > state.outstanding) {
        const message = `That’s more than the ${formatMoney(state.outstanding, debt.currency)} outstanding`;
        return { error: message, fieldErrors: { amount: message }, values: formValues(formData) };
    }
    const occurredOn = String(formData.get('occurredOn') ?? '') || today();
    if (!isIsoDate(occurredOn)) return { error: 'Enter a valid date', fieldErrors: { occurredOn: 'Enter a valid date' }, values: formValues(formData) };
    const { account, error } = loanAccount(user.id, String(formData.get('accountId') ?? ''), debt.currency);
    if (!account) return { error, fieldErrors: { accountId: error! }, values: formValues(formData) };
    const note = String(formData.get('note') ?? '').trim().slice(0, 500) || null;

    const split = db.transaction((tx) => insertRepayment(tx, debt, account.id, amount, occurredOn, note));
    refreshMoney(debt.id);

    const settled = amount === state.outstanding;
    const parts = split.interest ? ` (${formatMoney(split.principal, debt.currency)} principal + ${formatMoney(split.interest, debt.currency)} charges)` : '';
    return { ok: true, message: settled ? `Loan settled${parts} 🎉` : `Repayment recorded${parts}` };
}

// ---------------------------------------------------------------------------
// Routines
// ---------------------------------------------------------------------------

const STEP_FREQUENCIES = new Set(['never', 'daily', 'weekly', 'weekdays', 'weekends', 'fortnightly', 'monthly', 'every3months', 'every6months', 'yearly']);

export async function addScheduleItem(scheduleId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    if (!getRecord(moduleOrThrow('schedules'), user.id, scheduleId)) return { error: 'Routine not found' };

    const title = String(formData.get('title') ?? '').trim();
    const frequency = String(formData.get('frequency') ?? 'daily');
    const time = String(formData.get('time') ?? '');
    const errors: Record<string, string> = {};
    if (!title || title.length > 160) errors.title = 'Give the step a short name';
    if (!STEP_FREQUENCIES.has(frequency)) errors.frequency = 'Choose how often';
    if (time && !/^\d{2}:\d{2}$/.test(time)) errors.time = 'Enter a valid time';
    if (Object.keys(errors).length) return { error: 'Please fix the highlighted fields', fieldErrors: errors, values: formValues(formData) };

    db.insert(schema.scheduleItems)
        .values({
            userId: user.id,
            scheduleId,
            title,
            frequency: frequency as typeof schema.scheduleItems.$inferInsert.frequency,
            startsAt: `${today()}T${time || '00:00'}`,
        })
        .run();
    refresh('schedules', scheduleId);
    return { ok: true, message: 'Step added' };
}

export async function deleteScheduleItem(scheduleId: string, itemId: string) {
    const user = await requireUser();
    const s = schema.scheduleItems;
    db.delete(s).where(and(eq(s.id, itemId), eq(s.userId, user.id), eq(s.scheduleId, scheduleId))).run();
    refresh('schedules', scheduleId);
}

// ---------------------------------------------------------------------------
// Employer contacts
// ---------------------------------------------------------------------------

const CONTACT_TYPES = ['email', 'phone', 'link', 'address', 'other'] as const;
type ContactType = (typeof CONTACT_TYPES)[number];

function contactProblem(type: ContactType, value: string) {
    if (!value) return 'Enter the contact detail';
    if (value.length > 500) return 'Keep it under 500 characters';
    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email';
    if (type === 'phone' && !isPhone(value)) return 'Enter a valid phone number';
    if (type === 'link' && !isHttpUrl(value)) return 'Enter a full link starting with https://';
    return null;
}

export async function addEmployerContact(employerId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    if (!getRecord(moduleOrThrow('work'), user.id, employerId)) return { error: 'Employer not found' };

    const type = String(formData.get('type') ?? '') as ContactType;
    const value = String(formData.get('value') ?? '').trim();
    const label = String(formData.get('label') ?? '').trim();
    if (!CONTACT_TYPES.includes(type)) return { error: 'Choose a contact type', fieldErrors: { type: 'Choose a type' }, values: formValues(formData) };
    const problem = contactProblem(type, value);
    if (problem) return { error: problem, fieldErrors: { value: problem }, values: formValues(formData) };
    if (label.length > 60) return { error: 'Keep the label short', fieldErrors: { label: 'Max 60 characters' }, values: formValues(formData) };

    db.insert(schema.employerContacts)
        .values({ userId: user.id, employerId, type, value, label: label || type[0].toUpperCase() + type.slice(1) })
        .run();
    refresh('work', employerId);
    return { ok: true, message: 'Contact added' };
}

export async function deleteEmployerContact(employerId: string, contactId: string) {
    const user = await requireUser();
    const c = schema.employerContacts;
    db.delete(c).where(and(eq(c.id, contactId), eq(c.userId, user.id), eq(c.employerId, employerId))).run();
    refresh('work', employerId);
}
