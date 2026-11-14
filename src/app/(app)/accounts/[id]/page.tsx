import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Button from '@/components/ui/button';
import Link from '@/components/ui/link';
import Pager from '@/components/ui/pager';
import { Badge, Card, CardTitle, PageHeader } from '@/components/ui/card';
import Money from '@/components/finance/money';
import EntryForm from '@/components/finance/entry-form';
import { entryFormProps } from '@/components/finance/entry-form-props';
import TransactionList from '@/components/finance/transaction-list';
import { requireUser } from '@/server/auth/session';
import { getAccount, listAccounts, listCategories, listTransactions } from '@/server/finance/queries';
import { deleteAccount, makePrimaryAccount, setAccountArchived, updateAccount } from '@/server/finance/actions';
import ConfirmButton from '@/components/ui/confirm-button';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import Select from '@/components/ui/forms/select';
import CurrencySelect from '@/components/finance/currency-select';
import { fromMinor } from '@/lib/money';
import { today } from '@/lib/dates';
import routes from '@/config/routes';

export const metadata: Metadata = { title: 'Account' };

const PAGE_SIZE = 50;

const TYPE_OPTIONS = [
    { value: 'bank', label: 'Bank account' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'mobile', label: 'Mobile money' },
];

export default async function AccountPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ page?: string }>;
}) {
    const user = await requireUser();
    const { id } = await params;
    const page = Math.max(1, Number((await searchParams).page) || 1);

    const account = getAccount(user.id, id);
    if (!account) notFound();

    const { rows, hasMore } = listTransactions(user.id, { accountId: id, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });

    return (
        <>
            <PageHeader
                title={
                    <span className="flex flex-wrap items-center gap-3">
                        {account.name}
                        {account.isPrimary && <Badge tone="brand">Primary</Badge>}
                        {account.archivedAt && <Badge>Archived</Badge>}
                    </span>
                }
                subtitle={
                    <>
                        <Link href={routes.accounts} className="hover:text-brand">
                            Accounts
                        </Link>{' '}
                        · {account.type} · {account.currency} · opened with {fromMinor(account.openingBalanceMinor, account.currency)}
                    </>
                }
                actions={
                    <>
                        {!account.isPrimary && !account.archivedAt && (
                            <form action={makePrimaryAccount.bind(null, account.id)}>
                                <Button variant="outline" className="text-sm">
                                    Make primary
                                </Button>
                            </form>
                        )}
                        <form action={setAccountArchived.bind(null, account.id, !account.archivedAt)}>
                            <Button variant="outline" className="text-sm">
                                {account.archivedAt ? 'Restore' : 'Archive'}
                            </Button>
                        </form>
                    </>
                }
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <Card>
                    <CardTitle>
                        Balance <Money minor={account.balanceMinor} currency={account.currency} className="ml-2 text-heading-4 font-bold" />
                    </CardTitle>
                    <TransactionList rows={rows} showAccount={false} emptyText="No entries in this account yet." />
                    <Pager page={page} hasMore={hasMore} base={routes.account(account.id)} />
                </Card>
                <div className="space-y-6">
                    {!account.archivedAt && (
                        <Card>
                            <CardTitle>Add entry</CardTitle>
                            <EntryForm
                                {...entryFormProps(listAccounts(user.id), listCategories(user.id))}
                                defaultAccountId={account.id}
                                today={today()}
                            />
                        </Card>
                    )}
                    <Card>
                        <CardTitle>Account details</CardTitle>
                        <ActionForm action={updateAccount.bind(null, account.id)} className="space-y-4">
                            <Input label="Name" name="name" defaultValue={account.name} maxLength={100} required />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Select label="Type" name="type" options={TYPE_OPTIONS} defaultValue={account.type} />
                                <CurrencySelect label="Currency" name="currency" defaultValue={account.currency} />
                            </div>
                            <Input
                                label="Opening balance"
                                name="openingBalance"
                                inputMode="decimal"
                                defaultValue={fromMinor(account.openingBalanceMinor, account.currency)}
                                helpText="What the account held before your first entry."
                            />
                            <Input label="Description" name="description" defaultValue={account.description ?? ''} maxLength={500} />
                            <SubmitButton className="text-sm">Save</SubmitButton>
                        </ActionForm>
                        <div className="mt-6 border-t border-light-300 pt-4 dark:border-dark-light/30">
                            <ConfirmButton
                                action={deleteAccount.bind(null, account.id)}
                                label="Delete account"
                                warning={account.transactionCount ? 'It has entries, so it will be archived instead.' : 'This can’t be undone.'}
                                confirmLabel={account.transactionCount ? 'Archive it' : 'Yes, delete'}
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}
