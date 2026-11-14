'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { requireUser } from '@/server/auth/session';
import { getModule, statusOf } from '@/lib/modules/definitions';
import { formValues, type ActionState } from '@/lib/action-state';
import { addPeriod, isIsoDate, today } from '@/lib/dates';
import { toMinor } from '@/lib/money';
import { getRecord, tableFor } from './registry';
import { parseRecord } from './validate';
import { deleteEntityFiles } from '@/server/files';

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

    if (id) {
        if (!getRecord(def, user.id, id)) return { error: `That ${def.singular.toLowerCase()} no longer exists` };
        db.update(table).set(values as never).where(and(eq(columns.id, id), eq(columns.userId, user.id))).run();
        refresh(def.key, id);
        return { ok: true, message: 'Saved' };
    }

    if (def.statuses && !values.status && def.defaultStatus) values.status = def.defaultStatus;
    db.insert(table).values({ ...values, userId: user.id } as never).run();
    refresh(def.key);
    return { ok: true, message: `${def.singular} added` };
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

export async function settleDebt(debtId: string) {
    const user = await requireUser();
    db.update(schema.debts)
        .set({ status: 'paid', paidOn: today() })
        .where(and(eq(schema.debts.id, debtId), eq(schema.debts.userId, user.id)))
        .run();
    refresh('debts', debtId);
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
