import cn from 'classnames';
import { HiArrowUturnLeft } from 'react-icons/hi2';
import Money from '@/components/finance/money';
import Link from '@/components/ui/link';
import { Badge, EmptyState } from '@/components/ui/card';
import { setTransactionReversed } from '@/server/finance/actions';
import type { LedgerRow } from '@/server/finance/queries';
import { formatDate } from '@/lib/dates';
import routes from '@/config/routes';

function loanLabel(role: string | null, direction: string | null) {
    const lent = direction === 'lent';
    if (role === 'disbursement') return lent ? 'Money lent' : 'Loan received';
    return lent ? 'Repaid to you' : 'Loan repayment';
}

export default function TransactionList({
    rows,
    showAccount = true,
    emptyText = 'Nothing recorded yet.',
}: {
    rows: LedgerRow[];
    showAccount?: boolean;
    emptyText?: string;
}) {
    if (!rows.length) return <EmptyState title="No transactions">{emptyText}</EmptyState>;

    const byDate = Map.groupBy(rows, (r) => r.occurredOn);

    return (
        <div className="space-y-5">
            {[...byDate.entries()].map(([date, items]) => (
                <div key={date}>
                    <h3 className="mb-1 text-caption font-semibold uppercase tracking-wide text-body-muted">{formatDate(date)}</h3>
                    <ul className="divide-y divide-light-300 dark:divide-dark-light/20">
                        {items.map((t) => {
                            const reversed = t.status === 'reversed';
                            return (
                                <li key={t.id} className="flex items-center gap-3 py-2.5">
                                    <span
                                        aria-hidden="true"
                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                        style={{
                                            background:
                                                t.kind === 'transfer' ? '#A6B7D4' : t.kind === 'debt' ? '#F7936F' : (t.categoryColor ?? (t.amountMinor < 0 ? '#F16063' : '#66CB9F')),
                                        }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={routes.transaction(t.id)}
                                            className={cn(
                                                'block truncate text-body-2 font-medium text-heading-dark hover:text-brand dark:text-heading-light',
                                                reversed && 'line-through opacity-60'
                                            )}
                                        >
                                            {t.title}
                                        </Link>
                                        <div className="flex flex-wrap items-center gap-x-2 text-caption text-body-muted">
                                            {t.kind === 'transfer' ? (
                                                <span>
                                                    {t.title.startsWith('Transfer')
                                                        ? 'Transfer'
                                                        : `Transfer ${t.amountMinor < 0 ? 'to' : 'from'} ${t.counterAccountName}`}
                                                </span>
                                            ) : t.debtId ? (
                                                <Link href={`/debts/${t.debtId}`} className="hover:text-brand">
                                                    {t.kind === 'debt' ? loanLabel(t.debtRole, t.debtDirection) : (t.categoryName ?? 'Loan charges')} · {t.debtTitle}
                                                </Link>
                                            ) : t.kind === 'debt' ? (
                                                <span>Loan entry (loan deleted)</span>
                                            ) : (
                                                <span>{t.categoryName ?? 'Uncategorised'}</span>
                                            )}
                                            {showAccount && (
                                                <Link href={routes.account(t.accountId)} className="hover:text-brand">
                                                    · {t.accountName}
                                                </Link>
                                            )}
                                            {reversed && <Badge tone="danger">Reversed</Badge>}
                                        </div>
                                    </div>
                                    <Money
                                        minor={t.amountMinor}
                                        currency={t.currency}
                                        signed
                                        colored={!reversed}
                                        className={cn('text-body-2 font-semibold', reversed && 'line-through opacity-60')}
                                    />
                                    <form action={setTransactionReversed.bind(null, t.id, !reversed)}>
                                        <button
                                            type="submit"
                                            title={reversed ? 'Restore' : 'Reverse'}
                                            aria-label={reversed ? `Restore ${t.title}` : `Reverse ${t.title}`}
                                            className="rounded p-1.5 text-body-muted hover:bg-grey-200 hover:text-heading-dark dark:hover:bg-dark-light/30 dark:hover:text-heading-light"
                                        >
                                            <HiArrowUturnLeft className={cn('h-4 w-4', reversed && 'scale-x-[-1]')} />
                                        </button>
                                    </form>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </div>
    );
}
