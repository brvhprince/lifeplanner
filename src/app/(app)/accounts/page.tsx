import type { Metadata } from 'next';
import Link from '@/components/ui/link';
import { Badge, Card, CardTitle, EmptyState, PageHeader } from '@/components/ui/card';
import Money from '@/components/finance/money';
import OverdraftLine from '@/components/finance/overdraft-line';
import AccountForm from '@/components/finance/account-form';
import { requireUser } from '@/server/auth/session';
import { listAccounts } from '@/server/finance/queries';
import routes from '@/config/routes';
import AccountMeta from '@/components/finance/account-meta';
import { maskAccountNumber } from '@/lib/accounts';

export const metadata: Metadata = { title: 'Accounts' };

export default async function AccountsPage() {
    const user = await requireUser();
    const all = listAccounts(user.id, { includeArchived: true });
    const active = all.filter((a) => !a.archivedAt);
    const archived = all.filter((a) => a.archivedAt);

    return (
        <>
            <PageHeader title="Accounts" subtitle="Where your money lives. Balances are calculated from your entries." />
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    {active.length ? (
                        <ul className="grid gap-4 sm:grid-cols-2">
                            {active.map((a) => (
                                <li key={a.id}>
                                    <Link
                                        href={routes.account(a.id)}
                                        className="block rounded-xl border border-light-300 bg-white p-5 shadow-small transition-colors hover:border-brand dark:border-dark-light/30 dark:bg-dark"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-caption font-semibold uppercase text-body-muted">{a.type}</span>
                                            {a.isPrimary && <Badge tone="brand">Primary</Badge>}
                                        </div>
                                        <div className="mt-1 truncate text-heading-5 font-semibold text-heading-dark dark:text-heading-light">
                                            {a.name}
                                        </div>
                                        <AccountMeta institution={a.institution} accountNumber={a.accountNumber} />
                                        <Money minor={a.balanceMinor} currency={a.currency} className="mt-2 block text-heading-3 font-bold" />
                                        <OverdraftLine balanceMinor={a.balanceMinor} overdraftLimitMinor={a.overdraftLimitMinor} currency={a.currency} />
                                        <div className="mt-1 text-caption text-body-muted">
                                            {a.transactionCount} {a.transactionCount === 1 ? 'entry' : 'entries'}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="No accounts yet">Create one with the form.</EmptyState>
                    )}

                    {archived.length > 0 && (
                        <Card>
                            <CardTitle>Archived</CardTitle>
                            <ul className="divide-y divide-light-300 dark:divide-dark-light/20">
                                {archived.map((a) => (
                                    <li key={a.id} className="flex items-center justify-between py-2 text-body-2">
                                        <Link href={routes.account(a.id)} className="font-medium hover:text-brand">
                                            {a.name}
                                            {a.accountNumber && <span className="ml-2 text-body-muted">{maskAccountNumber(a.accountNumber)}</span>}
                                        </Link>
                                        <Money minor={a.balanceMinor} currency={a.currency} />
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
                <Card>
                    <CardTitle>New account</CardTitle>
                    <AccountForm currency={user.currency} />
                </Card>
            </div>
        </>
    );
}
