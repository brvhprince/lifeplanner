import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { maskAccountNumber } from '@/lib/accounts';
import { debtLedger, debtState, getDebt } from '@/server/finance/debts';
import { HiOutlineTrash } from 'react-icons/hi2';
import { Card, CardTitle, EmptyState } from '@/components/ui/card';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import Select from '@/components/ui/forms/select';
import ProgressBar from '@/components/ui/progress-bar';
import Money from '@/components/finance/money';
import { db, schema } from '@/server/db';
import {
    addEmployerContact,
    deleteEmployerContact,
    addGoalContribution,
    addScheduleItem,
    deleteGoalContribution,
    deleteScheduleItem,
    recordSubscriptionPayment,
    settleDebt,
    recordDebtDisbursement,
    recordDebtRepayment,
    linkDebtTransaction,
} from '@/server/modules/actions';
import type { RecordRow } from '@/server/modules/registry';
import { daysBetween, formatDate, today } from '@/lib/dates';
import { formatMoney, fromMinor } from '@/lib/money';
import Link from '@/components/ui/link';
import { Badge } from '@/components/ui/card';
import { getModule, statusOf } from '@/lib/modules/definitions';
import { HiOutlineEnvelope, HiOutlineGlobeAlt, HiOutlineMapPin, HiOutlinePhone, HiOutlineChatBubbleLeftEllipsis } from 'react-icons/hi2';

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

const ROLE_LABELS: Record<string, { owed: string; lent: string }> = {
    disbursement: { owed: 'Loan received', lent: 'Money lent' },
    fee: { owed: 'Upfront fee', lent: 'Fee' },
    repayment: { owed: 'Repayment', lent: 'Repaid to you' },
    interest: { owed: 'Finance charge', lent: 'Interest received' },
};

export function DebtPanel({ debtId, userId }: { debtId: string; userId: string }) {
    const debt = getDebt(userId, debtId);
    if (!debt) return null;
    const state = debtState(debt);
    const ledger = debtLedger(userId, debt.id);
    const borrowing = debt.direction === 'owed';
    const currency = debt.currency;
    const money = (minor: number) => formatMoney(minor, currency);

    const a = schema.accounts;
    const accountOptions = db
        .select({ id: a.id, name: a.name, accountNumber: a.accountNumber })
        .from(a)
        .where(and(eq(a.userId, userId), eq(a.currency, currency), isNull(a.archivedAt)))
        .orderBy(desc(a.isPrimary), a.name)
        .all()
        .map((x) => {
            const masked = maskAccountNumber(x.accountNumber);
            return { value: x.id, label: masked ? `${x.name} · ${masked}` : x.name };
        });

    const t = schema.transactions;
    const linkable =
        debt.status === 'active' && !state.disbursed
            ? db
                  .select({ id: t.id, title: t.title, amountMinor: t.amountMinor, occurredOn: t.occurredOn, account: a.name })
                  .from(t)
                  .innerJoin(a, eq(a.id, t.accountId))
                  .where(
                      and(
                          eq(t.userId, userId),
                          isNull(t.debtId),
                          isNull(t.transferId),
                          sql`coalesce(json_extract(${t.metadata}, '$.charge'), 0) = 0`,
                          eq(t.kind, borrowing ? 'income' : 'expense'),
                          eq(t.status, 'active'),
                          eq(a.currency, currency)
                      )
                  )
                  .orderBy(desc(t.occurredOn))
                  .limit(30)
                  .all()
            : [];

    // Settled by hand (or before repayments were tracked) with money unrecorded.
    const settledByHand = debt.status === 'paid' && state.outstanding > 0;
    const received = state.principal - (borrowing ? debt.upfrontFeeMinor : 0);
    const cost = (borrowing ? debt.upfrontFeeMinor : 0) + state.charges;
    const days = debt.dueOn ? daysBetween(today(), debt.dueOn) : null;
    const defaultAccount = debt.accountId && accountOptions.some((o) => o.value === debt.accountId) ? debt.accountId : accountOptions[0]?.value;

    const rows: [string, string, boolean?][] = [
        [borrowing ? 'Borrowed' : 'Lent', money(state.principal)],
        ...(borrowing && debt.upfrontFeeMinor > 0
            ? ([
                  ['Fees deducted upfront', `− ${money(debt.upfrontFeeMinor)}`],
                  ['Received', money(received)],
              ] as [string, string][])
            : []),
        ...(state.charges > 0 ? ([[borrowing ? 'Finance charge' : 'Interest', money(state.charges)]] as [string, string][]) : []),
        ['Total to repay', money(debt.amountMinor), true],
        ['Repaid so far', money(state.repaid)],
    ];

    return (
        <>
            <Card>
                <CardTitle>{borrowing ? 'Loan' : 'Money you lent'}</CardTitle>
                <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <div className="text-caption font-semibold uppercase tracking-wide text-body-muted">
                            {debt.status === 'paid' ? 'Settled' : borrowing ? 'Outstanding' : 'Still owed to you'}
                        </div>
                        <Money
                            minor={settledByHand ? 0 : state.outstanding}
                            currency={currency}
                            className="text-heading-2 font-bold text-heading-dark dark:text-heading-light"
                        />
                    </div>
                    {days !== null && debt.status === 'active' && (
                        <span className={days < 0 ? 'text-body-2 font-semibold text-danger-dark dark:text-danger' : 'text-body-2 text-body-muted'}>
                            {days < 0 ? `${-days} days overdue` : days === 0 ? 'Due today' : `Due in ${days} days`} · {formatDate(debt.dueOn!)}
                        </span>
                    )}
                </div>
                <ProgressBar
                    value={settledByHand ? debt.amountMinor : state.repaid}
                    max={debt.amountMinor}
                    color={debt.status === 'paid' ? '#4AAE8C' : undefined}
                />
                {settledByHand && (
                    <p className="mt-2 text-caption text-body-muted">
                        Marked settled by hand. {money(state.outstanding)} wasn’t recorded as repaid in your accounts. To track it, set the status back
                        to Outstanding and record the repayment.
                    </p>
                )}
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-body-2">
                    {rows.map(([label, value, strong]) => (
                        <div key={label} className="contents">
                            <dt className="text-body-muted">{label}</dt>
                            <dd className={strong ? 'text-right font-semibold' : 'text-right'}>{value}</dd>
                        </div>
                    ))}
                </dl>
                {cost > 0 && received > 0 && (
                    <p className="mt-3 rounded-md bg-grey-100 px-3 py-2 text-caption dark:bg-dark-dark">
                        {borrowing ? 'Cost of borrowing' : 'You earn'}: <strong>{money(cost)}</strong> ({((cost / received) * 100).toFixed(1)}% of what{' '}
                        {borrowing ? 'you received' : 'you lent'}). {borrowing ? 'Recorded as spending under “Loan charges”.' : 'Recorded as income when repaid.'}
                    </p>
                )}
            </Card>

            {debt.status === 'active' && !state.disbursed && (
                <Card>
                    <CardTitle>{borrowing ? 'Record the money you received' : 'Record the money you lent'}</CardTitle>
                    <p className="mb-4 text-body-2 text-body-muted">
                        {borrowing
                            ? `Adds ${money(received)} to the account${debt.upfrontFeeMinor > 0 ? ` (${money(state.principal)} borrowed, ${money(debt.upfrontFeeMinor)} fee as spending)` : ''}. It isn’t counted as income.`
                            : `Takes ${money(state.principal)} out of the account. It isn’t counted as spending.`}
                    </p>
                    {accountOptions.length ? (
                        <ActionForm action={recordDebtDisbursement.bind(null, debt.id)} className="grid gap-3 sm:grid-cols-[1fr_170px] sm:items-end">
                            <Select label="Account" name="accountId" options={accountOptions} defaultValue={defaultAccount} />
                            <Input label="Date" name="occurredOn" type="date" defaultValue={debt.startedOn ?? today()} />
                            <SubmitButton className="justify-self-start text-sm sm:col-span-2">Record it</SubmitButton>
                        </ActionForm>
                    ) : (
                        <EmptyState title={`No ${currency} account yet`}>Add one under Accounts first.</EmptyState>
                    )}
                    {linkable.length > 0 && (
                        <div className="mt-6 border-t border-light-300 pt-4 dark:border-dark-light/30">
                            <div className="mb-2 text-body-2 font-semibold">
                                Already entered it as {borrowing ? 'income' : 'an expense'}?
                            </div>
                            <p className="mb-3 text-caption text-body-muted">
                                Link that entry instead. It becomes part of this loan and stops counting as {borrowing ? 'income' : 'spending'}.
                            </p>
                            <ActionForm action={linkDebtTransaction.bind(null, debt.id)} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                                <Select
                                    label="Entry"
                                    name="transactionId"
                                    placeholder="Choose an entry"
                                    options={linkable.map((x) => ({
                                        value: x.id,
                                        label: `${formatDate(x.occurredOn)} · ${x.title} · ${formatMoney(Math.abs(x.amountMinor), currency)} · ${x.account}`,
                                    }))}
                                />
                                <SubmitButton variant="outline" className="text-sm">
                                    Link
                                </SubmitButton>
                            </ActionForm>
                        </div>
                    )}
                </Card>
            )}

            {debt.status === 'active' && state.outstanding > 0 && (
                <Card>
                    <CardTitle>{borrowing ? 'Record a repayment' : 'Record money paid back to you'}</CardTitle>
                    {accountOptions.length ? (
                        <ActionForm action={recordDebtRepayment.bind(null, debt.id)} className="grid gap-3 sm:grid-cols-2 sm:items-end">
                            <Input label={`Amount (${currency})`} name="amount" inputMode="decimal" defaultValue={fromMinor(state.outstanding, currency)} required />
                            <Input label="Date" name="occurredOn" type="date" defaultValue={today()} />
                            <Select label={borrowing ? 'Paid from' : 'Received into'} name="accountId" options={accountOptions} defaultValue={defaultAccount} />
                            <Input label="Note (optional)" name="note" maxLength={500} />
                            <SubmitButton className="justify-self-start text-sm sm:col-span-2">{borrowing ? 'Record repayment' : 'Record payment'}</SubmitButton>
                        </ActionForm>
                    ) : (
                        <EmptyState title={`No ${currency} account yet`}>Add one under Accounts first.</EmptyState>
                    )}
                    {state.charges > 0 && (
                        <p className="mt-3 text-caption text-body-muted">
                            Each payment is split between principal and {borrowing ? 'finance charge' : 'interest'} in proportion; the{' '}
                            {borrowing ? 'charge part counts as spending' : 'interest part counts as income'}.
                        </p>
                    )}
                    <form action={settleDebt.bind(null, debt.id)} className="mt-4 border-t border-light-300 pt-3 dark:border-dark-light/30">
                        <button type="submit" className="text-caption font-semibold text-body-muted hover:text-brand">
                            Mark settled without recording money (paid outside the app, or forgiven)
                        </button>
                    </form>
                </Card>
            )}

            {ledger.length > 0 && (
                <Card>
                    <CardTitle>Money movements</CardTitle>
                    <ul className="divide-y divide-light-300 dark:divide-dark-light/20">
                        {ledger.map((leg) => (
                            <li key={leg.id}>
                                <Link href={`/transactions/${leg.id}`} className="flex items-center gap-3 py-2.5 hover:text-brand">
                                    <span className="min-w-0 flex-1">
                                        <span className={leg.status === 'reversed' ? 'block text-body-2 font-medium line-through opacity-60' : 'block text-body-2 font-medium'}>
                                            {ROLE_LABELS[leg.role ?? '']?.[debt.direction] ?? leg.title}
                                        </span>
                                        <span className="block text-caption text-body-muted">
                                            {formatDate(leg.occurredOn)} · {leg.accountName}
                                            {leg.status === 'reversed' && ' · reversed'}
                                        </span>
                                    </span>
                                    <Money minor={leg.amountMinor} currency={currency} signed colored={leg.status === 'active'} className="text-body-2 font-semibold" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </>
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
                <SubmitButton className="justify-self-start text-sm sm:col-span-3">Add step</SubmitButton>
            </ActionForm>
        </Card>
    );
}

const CONTACT_ICONS = {
    email: HiOutlineEnvelope,
    phone: HiOutlinePhone,
    link: HiOutlineGlobeAlt,
    address: HiOutlineMapPin,
    other: HiOutlineChatBubbleLeftEllipsis,
} as const;

function contactHref(type: string, value: string) {
    if (type === 'email') return `mailto:${value}`;
    if (type === 'phone') return `tel:${value.replace(/[^\d+]/g, '')}`;
    if (type === 'link' && /^https?:\/\//i.test(value)) return value;
    return null;
}

export function EmployerPanel({ employer, userId }: { employer: RecordRow; userId: string }) {
    const c = schema.employerContacts;
    const contacts = db
        .select()
        .from(c)
        .where(and(eq(c.employerId, employer.id), eq(c.userId, userId)))
        .orderBy(c.createdAt)
        .all();
    const p = schema.projects;
    const projects = db
        .select({ id: p.id, title: p.title, status: p.status, dueOn: p.dueOn })
        .from(p)
        .where(and(eq(p.employerId, employer.id), eq(p.userId, userId)))
        .orderBy(desc(p.updatedAt))
        .all();
    const projectsDef = getModule('projects')!;

    return (
        <>
            <Card>
                <CardTitle>Contacts</CardTitle>
                {contacts.length > 0 && (
                    <ul className="mb-5 divide-y divide-light-300 dark:divide-dark-light/20">
                        {contacts.map((contact) => {
                            const Icon = CONTACT_ICONS[contact.type];
                            const href = contactHref(contact.type, contact.value);
                            return (
                                <li key={contact.id} className="flex items-start gap-3 py-2.5">
                                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-body-muted" aria-hidden="true" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-caption text-body-muted">{contact.label}</div>
                                        {href ? (
                                            <a
                                                href={href}
                                                {...(contact.type === 'link' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                                className="break-words text-body-2 font-medium text-brand hover:text-brand-light"
                                            >
                                                {contact.value}
                                            </a>
                                        ) : (
                                            <div className="whitespace-pre-line break-words text-body-2 font-medium">{contact.value}</div>
                                        )}
                                    </div>
                                    <form action={deleteEmployerContact.bind(null, employer.id, contact.id)}>
                                        <button type="submit" aria-label={`Remove ${contact.label}`} className={iconButton}>
                                            <HiOutlineTrash className="h-4 w-4" />
                                        </button>
                                    </form>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <ActionForm action={addEmployerContact.bind(null, employer.id)} className="grid gap-3 sm:grid-cols-[140px_1fr_1fr] sm:items-end">
                    <Select
                        label="Type"
                        name="type"
                        defaultValue="email"
                        options={[
                            { value: 'email', label: 'Email' },
                            { value: 'phone', label: 'Phone' },
                            { value: 'link', label: 'Website' },
                            { value: 'address', label: 'Address' },
                            { value: 'other', label: 'Other' },
                        ]}
                    />
                    <Input label="Label" name="label" placeholder="e.g. HR, Manager" maxLength={60} />
                    <Input label="Contact" name="value" placeholder="hr@company.com" maxLength={500} required />
                    <SubmitButton className="justify-self-start text-sm sm:col-span-3">Add contact</SubmitButton>
                </ActionForm>
            </Card>

            <Card>
                <CardTitle
                    action={
                        <Link href="/projects" className="text-sm font-semibold text-brand hover:text-brand-light">
                            New project
                        </Link>
                    }
                >
                    Projects
                </CardTitle>
                {projects.length ? (
                    <ul className="divide-y divide-light-300 dark:divide-dark-light/20">
                        {projects.map((project) => {
                            const status = statusOf(projectsDef, project.status);
                            return (
                                <li key={project.id}>
                                    <Link href={`/projects/${project.id}`} className="flex items-center gap-3 py-2.5 hover:text-brand">
                                        <span className="min-w-0 flex-1 truncate text-body-2 font-medium">{project.title}</span>
                                        {project.dueOn && <span className="text-caption text-body-muted">Due {formatDate(project.dueOn)}</span>}
                                        {status && <Badge tone={status.tone}>{status.label}</Badge>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <EmptyState title="No linked projects">Pick this employer on a project to see it here.</EmptyState>
                )}
            </Card>
        </>
    );
}
