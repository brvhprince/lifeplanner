import Link from '@/components/ui/link';
import { Badge, Card, CardTitle, EmptyState } from '@/components/ui/card';
import Money from '@/components/finance/money';
import ProgressBar from '@/components/ui/progress-bar';
import FlowChart from '@/components/people/flow-chart';
import { chartData, personMoney } from '@/server/finance/people';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/dates';

/** Money between the user and one person, shown on the person's page. */
export default function PersonMoney({ userId, personId, name, mainCurrency }: { userId: string; personId: string; name: string; mainCurrency: string }) {
    const data = personMoney(userId, personId, mainCurrency);
    const first = name.split(' ')[0];
    const hasFlows = data.totals.length > 0;
    const hasChart = data.months.some((m) => m.given || m.received);
    const entryCount = data.totals.reduce((sum, t) => sum + t.count, 0);
    const since = data.totals.reduce<string | null>((min, t) => (!min || t.first < min ? t.first : min), null);

    if (!hasFlows && !data.loans.length) {
        return (
            <Card>
                <CardTitle>Money with {first}</CardTitle>
                <EmptyState title="Nothing recorded yet">
                    Choose {first} under “To” or “From” when you add an expense or income, or as the person on a loan.
                </EmptyState>
            </Card>
        );
    }

    return (
        <Card>
            <CardTitle
                action={
                    <Link href={`/transactions?person=${personId}`} className="text-sm font-semibold text-brand hover:text-brand-light">
                        All entries
                    </Link>
                }
            >
                Money with {first}
            </CardTitle>

            {hasFlows && (
                <dl className="mb-6 grid gap-4 sm:grid-cols-3">
                    {[
                        { label: 'You gave', key: 'given' as const },
                        { label: 'You received', key: 'received' as const },
                    ].map((stat) => (
                        <div key={stat.key}>
                            <dt className="text-caption font-semibold uppercase tracking-wide text-body-muted">{stat.label}</dt>
                            {data.totals.map((t, i) => (
                                <dd key={t.currency} className={i ? 'text-body-2 font-semibold' : 'text-heading-4 font-bold text-heading-dark dark:text-heading-light'}>
                                    {formatMoney(t[stat.key], t.currency)}
                                </dd>
                            ))}
                        </div>
                    ))}
                    <div>
                        <dt className="text-caption font-semibold uppercase tracking-wide text-body-muted">Balance</dt>
                        {data.totals.map((t) => {
                            const net = t.received - t.given;
                            return (
                                <dd key={t.currency} className="text-body-2">
                                    {net === 0
                                        ? 'Even'
                                        : net < 0
                                          ? `You’ve given ${formatMoney(-net, t.currency)} more`
                                          : `You’ve received ${formatMoney(net, t.currency)} more`}
                                </dd>
                            );
                        })}
                        <dd className="mt-1 text-caption text-body-muted">
                            {entryCount} {entryCount === 1 ? 'entry' : 'entries'} · since {since ? formatDate(since) : '—'}
                        </dd>
                    </div>
                </dl>
            )}

            {hasChart && <FlowChart currency={data.chartCurrency} {...chartData(data.months, data.chartCurrency)} />}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {data.byCategory.length > 0 && (
                    <div>
                        <h3 className="mb-2 text-body-2 font-semibold">By category</h3>
                        <ul className="space-y-2 text-body-2">
                            {data.byCategory.map((row) => (
                                <li key={`${row.name}-${row.kind}-${row.currency}`} className="flex items-center gap-2">
                                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.color ?? '#A6B7D4' }} />
                                    <span className="min-w-0 flex-1 truncate">
                                        {row.name} <span className="text-caption text-body-muted">· {row.kind === 'expense' ? 'given' : 'received'}</span>
                                    </span>
                                    <Money minor={row.totalMinor} currency={row.currency} className="font-semibold" />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {data.loans.length > 0 && (
                    <div>
                        <h3 className="mb-2 text-body-2 font-semibold">Loans</h3>
                        <ul className="space-y-3">
                            {data.loans.map(({ debt, state }) => {
                                const settled = debt.status !== 'active';
                                return (
                                    <li key={debt.id}>
                                        <Link href={`/debts/${debt.id}`} className="block hover:text-brand">
                                            <div className="mb-1 flex items-baseline justify-between gap-2 text-body-2">
                                                <span className="min-w-0 truncate font-medium">
                                                    {debt.title} <span className="text-caption text-body-muted">· {debt.direction === 'lent' ? `${first} owes you` : `you owe ${first}`}</span>
                                                </span>
                                                {settled ? (
                                                    <Badge tone="success">Settled</Badge>
                                                ) : (
                                                    <Money minor={state.outstanding} currency={debt.currency} className="shrink-0 font-semibold" />
                                                )}
                                            </div>
                                            {!settled && <ProgressBar value={state.repaid} max={debt.amountMinor} />}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            {data.recent.length > 0 && (
                <div className="mt-6">
                    <h3 className="mb-1 text-body-2 font-semibold">Recent</h3>
                    <ul className="divide-y divide-light-300 dark:divide-dark-light/20">
                        {data.recent.map((r) => (
                            <li key={r.id}>
                                <Link href={`/transactions/${r.id}`} className="flex items-center gap-3 py-2 hover:text-brand">
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-body-2 font-medium">{r.title}</span>
                                        <span className="block text-caption text-body-muted">
                                            {formatDate(r.occurredOn)}
                                            {r.kind === 'debt' ? ' · Loan' : r.category ? ` · ${r.category}` : ''}
                                        </span>
                                    </span>
                                    <Money minor={r.amountMinor} currency={r.currency} signed colored className="text-body-2 font-semibold" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Card>
    );
}
