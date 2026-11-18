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
import { listCategories, listPeople, listTransactions } from '@/server/finance/queries';
import { currentMonth, formatMonth, shiftMonth, today } from '@/lib/dates';
import routes from '@/config/routes';

export const metadata: Metadata = { title: 'Transactions' };

const PAGE_SIZE = 50;

export default async function TransactionsPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; page?: string; category?: string; person?: string }>;
}) {
    const user = await requireUser();
    const params = await searchParams;
    const month = /^\d{4}-\d{2}$/.test(params.month ?? '') ? params.month! : currentMonth();
    const page = Math.max(1, Number(params.page) || 1);

    const categories = listCategories(user.id, { includeArchived: true });
    // A category filter shows that category's entries across all time.
    const category = categories.find((c) => c.id === params.category);
    // A person filter likewise shows everything with that person.
    const people = listPeople(user.id);
    const person = category ? undefined : people.find((p) => p.id === params.person);
    const filtered = Boolean(category || person);

    const summary = financeSummary(user.id, user.currency, month);
    const { rows, hasMore } = listTransactions(user.id, {
        month: filtered ? undefined : month,
        categoryId: category?.id,
        personId: person?.id,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
    });
    const monthHref = (m: string) => `${routes.transactions}?month=${m}`;
    const isCurrent = month === currentMonth();

    return (
        <>
            <PageHeader
                title="Transactions"
                subtitle={
                    filtered ? (
                        <span>
                            All entries {category ? 'in' : 'with'} <strong>{category?.name ?? person?.name}</strong> ·{' '}
                            <Link href={routes.transactions} className="font-semibold text-brand">
                                Clear filter
                            </Link>
                        </span>
                    ) : (
                        formatMonth(month)
                    )
                }
                actions={
                    !filtered && (
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
                    )
                }
            />

            {!filtered && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <StatTile label="Income" amounts={summary.income} fallbackCurrency={user.currency} />
                    <StatTile label="Spent" amounts={summary.expense} fallbackCurrency={user.currency} />
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <Card>
                    <TransactionList rows={rows} emptyText={category ? 'Nothing recorded in this category yet.' : person ? `Nothing recorded with ${person.name} yet.` : `Nothing recorded in ${formatMonth(month)}.`} />
                    <Pager page={page} hasMore={hasMore} base={routes.transactions} query={category ? { category: category.id } : person ? { person: person.id } : { month }} />
                </Card>
                {summary.accounts.length > 0 && (
                    <Card>
                        <CardTitle>Add entry</CardTitle>
                        <EntryForm {...entryFormProps(summary.accounts, categories.filter((c) => !c.archivedAt), people)} defaultPersonId={person?.id} today={today()} />
                    </Card>
                )}
            </div>
        </>
    );
}
