import type { Metadata } from 'next';
import Link from '@/components/ui/link';
import { Card, CardTitle, EmptyState, PageHeader } from '@/components/ui/card';
import StatTile from '@/components/finance/stat-tile';
import Money from '@/components/finance/money';
import OverdraftLine from '@/components/finance/overdraft-line';
import EntryForm from '@/components/finance/entry-form';
import AccountForm from '@/components/finance/account-form';
import TransactionList from '@/components/finance/transaction-list';
import { entryFormProps } from '@/components/finance/entry-form-props';
import { requireUser } from '@/server/auth/session';
import { financeSummary } from '@/server/finance/summary';
import { listCategories, listPeople, listTransactions, spendingByCategory } from '@/server/finance/queries';
import { currentMonth, formatMonth, today } from '@/lib/dates';
import routes from '@/config/routes';
import UpcomingCard from '@/components/dashboard/upcoming-card';
import ProgressBar from '@/components/ui/progress-bar';
import { activeGoals, relativeDay, upcoming } from '@/server/upcoming';
import { formatMoney } from '@/lib/money';

export const metadata: Metadata = { title: 'Dashboard' };

function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export default async function DashboardPage() {
    const user = await requireUser();
    const month = currentMonth();
    const summary = financeSummary(user.id, user.currency, month);
    const coming = upcoming(user.id);

    if (!summary.accounts.length) {
        return (
            <>
                <PageHeader title={`Welcome, ${user.firstName}`} subtitle="Start by adding the accounts you keep money in." />
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardTitle>Add your first account</CardTitle>
                        <AccountForm currency={user.currency} />
                    </Card>
                    <div className="space-y-6">
                    <UpcomingCard items={coming} />
                    <Card>
                        <CardTitle>How it works</CardTitle>
                        <ul className="list-disc space-y-2 pl-5 text-body-2">
                            <li>Accounts hold money: a bank account, cash, a card or mobile money.</li>
                            <li>Record income, expenses and transfers between accounts.</li>
                            <li>Balances are always calculated from what you record, so they never drift.</li>
                            <li>Everything is stored in a single SQLite file on your server.</li>
                        </ul>
                    </Card>
                    </div>
                </div>
            </>
        );
    }

    const recent = listTransactions(user.id, { limit: 8 }).rows;
    const spending = spendingByCategory(user.id, month).filter((s) => s.currency === user.currency).slice(0, 6);
    const maxSpend = Math.max(...spending.map((s) => s.totalMinor), 1);
    const categories = listCategories(user.id);
    const goals = activeGoals(user.id);

    return (
        <>
            <PageHeader title={`${greeting()}, ${user.firstName}`} subtitle={formatMonth(month)} />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatTile label="Total balance" amounts={summary.balance} fallbackCurrency={user.currency} note="In your accounts" />
                <StatTile
                    label="You owe"
                    amounts={summary.owe}
                    fallbackCurrency={user.currency}
                    note={
                        summary.overdraftUsed.length
                            ? `Loans + ${summary.overdraftUsed.map((o) => formatMoney(o.minor, o.currency)).join(', ')} overdraft`
                            : 'Outstanding loans'
                    }
                />
                <StatTile
                    label="Net position"
                    amounts={summary.position}
                    fallbackCurrency={user.currency}
                    colored
                    note={
                        summary.owedToYou.length
                            ? `Incl. ${summary.owedToYou.map((o) => formatMoney(o.minor, o.currency)).join(', ')} owed to you`
                            : 'Balance minus what you owe'
                    }
                />
                <StatTile label="Income this month" amounts={summary.income} fallbackCurrency={user.currency} note="Loans not counted" />
                <StatTile label="Spent this month" amounts={summary.expense} fallbackCurrency={user.currency} note="Incl. loan charges" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <Card>
                        <CardTitle
                            action={
                                <Link href={routes.accounts} className="text-sm font-semibold text-brand hover:text-brand-light">
                                    Manage
                                </Link>
                            }
                        >
                            Accounts
                        </CardTitle>
                        <ul className="grid gap-3 sm:grid-cols-2">
                            {summary.accounts.map((a) => (
                                <li key={a.id}>
                                    <Link
                                        href={routes.account(a.id)}
                                        className="block rounded-lg border border-light-300 p-4 transition-colors hover:border-brand dark:border-dark-light/30"
                                    >
                                        <div className="text-caption font-semibold uppercase text-body-muted">
                                            {a.type}
                                            {a.isPrimary && ' · primary'}
                                        </div>
                                        <div className="truncate font-semibold text-heading-dark dark:text-heading-light">{a.name}</div>
                                        <Money minor={a.balanceMinor} currency={a.currency} className="text-heading-4 font-bold" />
                                        <OverdraftLine balanceMinor={a.balanceMinor} overdraftLimitMinor={a.overdraftLimitMinor} currency={a.currency} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {summary.nextLoans.length > 0 && (
                        <Card>
                            <CardTitle
                                action={
                                    <Link href="/debts" className="text-sm font-semibold text-brand hover:text-brand-light">
                                        All debts
                                    </Link>
                                }
                            >
                                Loans to repay
                            </CardTitle>
                            <ul className="space-y-4">
                                {summary.nextLoans.slice(0, 6).map(({ debt, state }) => (
                                    <li key={debt.id}>
                                        <Link href={`/debts/${debt.id}`} className="block hover:text-brand">
                                            <div className="mb-1 flex items-baseline justify-between gap-3">
                                                <span className="min-w-0 truncate text-body-2 font-medium">
                                                    {debt.title}
                                                    {debt.counterparty && <span className="text-body-muted"> · {debt.counterparty}</span>}
                                                </span>
                                                <Money minor={state.outstanding} currency={debt.currency} className="shrink-0 text-body-2 font-semibold" />
                                            </div>
                                            <ProgressBar value={state.repaid} max={debt.amountMinor} />
                                            <div className="mt-1 flex justify-between text-caption text-body-muted">
                                                <span>
                                                    {state.repaid > 0
                                                        ? `${formatMoney(state.repaid, debt.currency)} of ${formatMoney(debt.amountMinor, debt.currency)} repaid`
                                                        : `${formatMoney(debt.amountMinor, debt.currency)} to repay`}
                                                </span>
                                                {debt.dueOn && <span className={debt.dueOn < today() ? 'font-semibold text-danger-dark dark:text-danger' : ''}>{relativeDay(debt.dueOn)}</span>}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    <Card>
                        <CardTitle
                            action={
                                <Link href={routes.transactions} className="text-sm font-semibold text-brand hover:text-brand-light">
                                    View all
                                </Link>
                            }
                        >
                            Recent activity
                        </CardTitle>
                        <TransactionList rows={recent} emptyText="Use the form to record your first entry." />
                    </Card>
                </div>

                <div className="space-y-6">
                    <UpcomingCard items={coming} />
                    <Card>
                        <CardTitle>Quick entry</CardTitle>
                        <EntryForm {...entryFormProps(summary.accounts, categories, listPeople(user.id))} today={today()} />
                    </Card>

                    <Card>
                        <CardTitle>Spending by category</CardTitle>
                        {spending.length ? (
                            <ul className="space-y-3">
                                {spending.map((s) => (
                                    <li key={s.categoryId ?? 'none'}>
                                        <div className="mb-1 flex justify-between text-body-2">
                                            <span className="font-medium">{s.name}</span>
                                            <Money minor={s.totalMinor} currency={s.currency} className="font-semibold" />
                                        </div>
                                        <div className="h-2 rounded-full bg-grey-200 dark:bg-dark-dark">
                                            <div
                                                className="h-2 rounded-full bg-brand"
                                                style={{ width: `${(s.totalMinor / maxSpend) * 100}%`, background: s.color ?? undefined }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState title="No spending yet">Expenses in {user.currency} this month show up here.</EmptyState>
                        )}
                    </Card>

                    {goals.length > 0 && (
                        <Card>
                            <CardTitle
                                action={
                                    <Link href="/goals" className="text-sm font-semibold text-brand hover:text-brand-light">
                                        All goals
                                    </Link>
                                }
                            >
                                Goals
                            </CardTitle>
                            <ul className="space-y-4">
                                {goals.map((g) => (
                                    <li key={g.id}>
                                        <Link href={`/goals/${g.id}`} className="block hover:text-brand">
                                            <div className="mb-1 flex justify-between gap-3 text-body-2">
                                                <span className="truncate font-medium">{g.title}</span>
                                                <span className="shrink-0 text-caption text-body-muted">
                                                    {formatMoney(g.savedMinor, g.currency)} / {formatMoney(g.targetMinor, g.currency)}
                                                </span>
                                            </div>
                                            <ProgressBar value={g.savedMinor} max={g.targetMinor} />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}
