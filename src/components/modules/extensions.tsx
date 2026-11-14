import { and, desc, eq } from 'drizzle-orm';
import { HiOutlineTrash } from 'react-icons/hi2';
import { Card, CardTitle, EmptyState } from '@/components/ui/card';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import Select from '@/components/ui/forms/select';
import Button from '@/components/ui/button';
import ProgressBar from '@/components/ui/progress-bar';
import Money from '@/components/finance/money';
import { db, schema } from '@/server/db';
import {
    addGoalContribution,
    addScheduleItem,
    deleteGoalContribution,
    deleteScheduleItem,
    recordSubscriptionPayment,
    settleDebt,
} from '@/server/modules/actions';
import type { RecordRow } from '@/server/modules/registry';
import { daysBetween, formatDate, today } from '@/lib/dates';
import { formatMoney, fromMinor } from '@/lib/money';

const iconButton =
    'rounded p-1.5 text-body-muted hover:bg-grey-200 hover:text-danger-dark dark:hover:bg-dark-light/30';

export function GoalPanel({ goal, userId }: { goal: RecordRow; userId: string }) {
    const c = schema.goalContributions;
    const contributions = db
        .select()
        .from(c)
        .where(and(eq(c.goalId, goal.id), eq(c.userId, userId)))
        .orderBy(desc(c.occurredOn), desc(c.createdAt))
        .all();
    const currency = String(goal.currency);
    const target = Number(goal.targetMinor);
    const saved = contributions.reduce((sum, x) => sum + x.amountMinor, 0);
    const remaining = Math.max(0, target - saved);
    const daysLeft = goal.deadline ? daysBetween(today(), String(goal.deadline)) : null;

    return (
        <Card>
            <CardTitle>Progress</CardTitle>
            <div className="mb-2 flex items-end justify-between gap-4">
                <Money minor={saved} currency={currency} className="text-heading-2 font-bold text-heading-dark dark:text-heading-light" />
                <span className="text-body-2 text-body-muted">of {formatMoney(target, currency)}</span>
            </div>
            <ProgressBar value={saved} max={target} />
            <div className="mt-2 text-body-2 text-body-muted">
                {remaining > 0 ? `${formatMoney(remaining, currency)} to go` : 'Target reached 🎉'}
                {daysLeft !== null && remaining > 0 && (daysLeft >= 0 ? ` · ${daysLeft} days left` : ` · ${-daysLeft} days past the deadline`)}
                {daysLeft !== null && daysLeft > 30 && remaining > 0 && (
                    <> · about {formatMoney(Math.ceil(remaining / (daysLeft / 30.44)), currency)} a month</>
                )}
            </div>

            <ActionForm action={addGoalContribution.bind(null, goal.id)} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Input label={`Add (${currency})`} name="amount" inputMode="decimal" placeholder="0.00" required />
                <Input label="Date" name="occurredOn" type="date" defaultValue={today()} />
                <SubmitButton className="text-sm">Add</SubmitButton>
            </ActionForm>

            {contributions.length > 0 && (
                <ul className="mt-6 divide-y divide-light-300 text-body-2 dark:divide-dark-light/20">
                    {contributions.map((x) => (
                        <li key={x.id} className="flex items-center justify-between gap-3 py-2">
                            <span className="text-body-muted">{formatDate(x.occurredOn)}</span>
                            <span className="flex items-center gap-2">
                                <Money minor={x.amountMinor} currency={currency} signed colored className="font-semibold" />
                                <form action={deleteGoalContribution.bind(null, goal.id, x.id)}>
                                    <button type="submit" aria-label="Remove contribution" className={iconButton}>
                                        <HiOutlineTrash className="h-4 w-4" />
                                    </button>
                                </form>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

export function SubscriptionPanel({ sub, userId }: { sub: RecordRow; userId: string }) {
    const t = schema.transactions;
    const payments = db
        .select()
        .from(t)
        .where(and(eq(t.subscriptionId, sub.id), eq(t.userId, userId), eq(t.status, 'active')))
        .orderBy(desc(t.occurredOn))
        .limit(12)
        .all();
    const currency = String(sub.currency);
    const nextDue = sub.nextDueOn ? String(sub.nextDueOn) : null;
    const days = nextDue ? daysBetween(today(), nextDue) : null;
    const isIncome = sub.kind === 'income';

    return (
        <Card>
            <CardTitle>{isIncome ? 'Receipts' : 'Payments'}</CardTitle>
            {nextDue && (
                <p className="mb-4 text-body-2">
                    Next {isIncome ? 'expected' : 'due'} <strong>{formatDate(nextDue)}</strong>
                    {days !== null && (days < 0 ? ` · ${-days} days overdue` : days === 0 ? ' · today' : ` · in ${days} days`)}
                </p>
            )}
            <ActionForm action={recordSubscriptionPayment.bind(null, sub.id)} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Input label={`Amount (${currency})`} name="amount" inputMode="decimal" defaultValue={fromMinor(Number(sub.amountMinor), currency)} />
                <Input label="Date" name="occurredOn" type="date" defaultValue={nextDue && nextDue <= today() ? nextDue : today()} />
                <SubmitButton className="text-sm">{isIncome ? 'Record receipt' : 'Record payment'}</SubmitButton>
            </ActionForm>
            <p className="mt-2 text-caption text-body-muted">
                Adds a transaction to the linked account and moves the due date to the next period.
            </p>
            {payments.length > 0 ? (
                <ul className="mt-5 divide-y divide-light-300 text-body-2 dark:divide-dark-light/20">
                    {payments.map((p) => (
                        <li key={p.id} className="flex justify-between py-2">
                            <span className="text-body-muted">{formatDate(p.occurredOn)}</span>
                            <Money minor={p.amountMinor} currency={currency} signed colored className="font-semibold" />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="mt-5">
                    <EmptyState title="No payments recorded yet" />
                </div>
            )}
        </Card>
    );
}

export function DebtPanel({ debt }: { debt: RecordRow }) {
    if (debt.status !== 'active') return null;
    const days = debt.dueOn ? daysBetween(today(), String(debt.dueOn)) : null;
    return (
        <Card>
            <CardTitle>{debt.direction === 'lent' ? 'Owed to you' : 'You owe'}</CardTitle>
            <Money
                minor={Number(debt.amountMinor)}
                currency={String(debt.currency)}
                className="block text-heading-2 font-bold text-heading-dark dark:text-heading-light"
            />
            {days !== null && (
                <p className="mt-1 text-body-2 text-body-muted">
                    {days < 0 ? `${-days} days overdue` : days === 0 ? 'Due today' : `Due in ${days} days`}
                </p>
            )}
            <form action={settleDebt.bind(null, debt.id)} className="mt-4">
                <Button className="text-sm">Mark as settled</Button>
            </form>
        </Card>
    );
}

const STEP_FREQUENCIES = [
    { value: 'daily', label: 'Every day' },
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'fortnightly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'every3months', label: 'Every 3 months' },
    { value: 'every6months', label: 'Every 6 months' },
    { value: 'yearly', label: 'Yearly' },
];

export function SchedulePanel({ schedule, userId }: { schedule: RecordRow; userId: string }) {
    const s = schema.scheduleItems;
    const items = db
        .select()
        .from(s)
        .where(and(eq(s.scheduleId, schedule.id), eq(s.userId, userId)))
        .orderBy(s.startsAt)
        .all()
        .sort((a, b) => a.startsAt.slice(11).localeCompare(b.startsAt.slice(11)));

    return (
        <Card>
            <CardTitle>Steps</CardTitle>
            {items.length ? (
                <ol className="mb-6 divide-y divide-light-300 dark:divide-dark-light/20">
                    {items.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 py-2.5">
                            <span className="w-14 shrink-0 font-semibold tabular-nums text-brand">
                                {item.startsAt.slice(11) !== '00:00' ? item.startsAt.slice(11) : '—'}
                            </span>
                            <span className="flex-1 font-medium">{item.title}</span>
                            <span className="text-caption text-body-muted">
                                {STEP_FREQUENCIES.find((f) => f.value === item.frequency)?.label ?? item.frequency}
                            </span>
                            <form action={deleteScheduleItem.bind(null, schedule.id, item.id)}>
                                <button type="submit" aria-label={`Remove ${item.title}`} className={iconButton}>
                                    <HiOutlineTrash className="h-4 w-4" />
                                </button>
                            </form>
                        </li>
                    ))}
                </ol>
            ) : (
                <div className="mb-6">
                    <EmptyState title="No steps yet">Add what you do, in order.</EmptyState>
                </div>
            )}
            <ActionForm action={addScheduleItem.bind(null, schedule.id)} className="grid gap-3 sm:grid-cols-[1fr_130px_160px] sm:items-end">
                <Input label="Step" name="title" placeholder="e.g. 20 min walk" maxLength={160} required />
                <Input label="Time" name="time" type="time" />
                <Select label="How often" name="frequency" options={STEP_FREQUENCIES} defaultValue="daily" />
                <SubmitButton className="text-sm sm:col-span-3 sm:w-auto">Add step</SubmitButton>
            </ActionForm>
        </Card>
    );
}
