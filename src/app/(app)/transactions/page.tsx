import type { Metadata } from 'next';
import Link from '@/components/ui/link';
import Pager from '@/components/ui/pager';
import { Card, CardTitle, PageHeader } from '@/components/ui/card';
import EntryForm from '@/components/finance/entry-form';
import { entryFormProps } from '@/components/finance/entry-form-props';
import TransactionList from '@/components/finance/transaction-list';
import StatTile from '@/components/finance/stat-tile';
import { requireUser } from '@/server/auth/session';
import { financeSummary } from '@/server/finance/summary';
import { listCategories, listTransactions } from '@/server/finance/queries';
import { currentMonth, formatMonth, shiftMonth, today } from '@/lib/dates';
import routes from '@/config/routes';

export const metadata: Metadata = { title: 'Transactions' };

const PAGE_SIZE = 50;

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ month?: string; page?: string }> }) {
    const user = await requireUser();
    const params = await searchParams;
    const month = /^\d{4}-\d{2}$/.test(params.month ?? '') ? params.month! : currentMonth();
    const page = Math.max(1, Number(params.page) || 1);

    const summary = financeSummary(user.id, user.currency, month);
    const { rows, hasMore } = listTransactions(user.id, { month, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
    const monthHref = (m: string) => `${routes.transactions}?month=${m}`;
    const isCurrent = month === currentMonth();

    return (
        <>
            <PageHeader
                title="Transactions"
                subtitle={formatMonth(month)}
                actions={
                    <div className="flex items-center gap-1 text-sm font-semibold">
                        <Link href={monthHref(shiftMonth(month, -1))} className="rounded-md px-3 py-2 hover:bg-grey-200 dark:hover:bg-dark-light/30">
                            ← Previous
                        </Link>
                        {!isCurrent && (
                            <Link href={routes.transactions} className="rounded-md px-3 py-2 hover:bg-grey-200 dark:hover:bg-dark-light/30">
                                This month
                            </Link>
                        )}
                        {!isCurrent && (
                            <Link href={monthHref(shiftMonth(month, 1))} className="rounded-md px-3 py-2 hover:bg-grey-200 dark:hover:bg-dark-light/30">
                                Next →
                            </Link>
                        )}
                    </div>
                }
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <StatTile label="Income" amounts={summary.income} fallbackCurrency={user.currency} />
                <StatTile label="Spent" amounts={summary.expense} fallbackCurrency={user.currency} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <Card>
                    <TransactionList rows={rows} emptyText={`Nothing recorded in ${formatMonth(month)}.`} />
                    <Pager page={page} hasMore={hasMore} base={routes.transactions} query={{ month }} />
                </Card>
                {summary.accounts.length > 0 && (
                    <Card>
                        <CardTitle>Add entry</CardTitle>
                        <EntryForm {...entryFormProps(summary.accounts, listCategories(user.id))} today={today()} />
                    </Card>
                )}
            </div>
        </>
    );
}
