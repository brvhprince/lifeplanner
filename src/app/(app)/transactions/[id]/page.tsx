import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import Link from '@/components/ui/link';
import { Badge, Card, CardTitle, PageHeader } from '@/components/ui/card';
import ConfirmButton from '@/components/ui/confirm-button';
import Button from '@/components/ui/button';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import Select from '@/components/ui/forms/select';
import Textarea from '@/components/ui/forms/textarea';
import Money from '@/components/finance/money';
import AttachmentsPanel from '@/components/files/attachments-panel';
import { db, schema } from '@/server/db';
import { requireUser } from '@/server/auth/session';
import { getTransfer, listAccounts, listCategories } from '@/server/finance/queries';
import { deleteEntry, setTransactionReversed, updateEntry } from '@/server/finance/actions';
import { fromMinor } from '@/lib/money';
import { formatDate } from '@/lib/dates';
import routes from '@/config/routes';

export const metadata: Metadata = { title: 'Edit entry' };

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requireUser();
    const { id } = await params;
    const t = schema.transactions;
    const row = db.select().from(t).where(and(eq(t.id, id), eq(t.userId, user.id))).get();
    if (!row) notFound();

    const accounts = listAccounts(user.id, { includeArchived: true });
    const account = accounts.find((a) => a.id === row.accountId)!;
    const transfer = row.transferId ? getTransfer(user.id, row.transferId) : null;
    const reversed = row.status === 'reversed';

    return (
        <>
            <PageHeader
                title={
                    <span className="flex flex-wrap items-center gap-3">
                        {row.title}
                        {reversed && <Badge tone="danger">Reversed</Badge>}
                    </span>
                }
                subtitle={
                    <Link href={routes.transactions} className="hover:text-brand">
                        ← Transactions
                    </Link>
                }
            />
            <div className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_280px]">
                <div className="space-y-6">
                <Card>
                    <CardTitle>Edit {row.kind}</CardTitle>
                    <ActionForm action={updateEntry.bind(null, row.id)} className="space-y-4">
                        <Input label="Description" name="title" defaultValue={row.title} maxLength={120} required />
                        {transfer ? (
                            <p className="rounded-md bg-grey-100 p-3 text-body-2 dark:bg-dark-dark">
                                Transfer from {accounts.find((a) => a.id === transfer.fromAccountId)?.name} to{' '}
                                {accounts.find((a) => a.id === transfer.toAccountId)?.name}. To change amounts, delete it and record it again.
                            </p>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input label="Amount" name="amount" inputMode="decimal" defaultValue={fromMinor(Math.abs(row.amountMinor), account.currency)} required />
                                <Select
                                    label="Account"
                                    name="accountId"
                                    options={accounts.filter((a) => !a.archivedAt || a.id === row.accountId).map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }))}
                                    defaultValue={row.accountId}
                                />
                                <Select
                                    label="Category"
                                    name="categoryId"
                                    placeholder="Uncategorised"
                                    options={listCategories(user.id, { includeArchived: true })
                                        .filter((c) => c.kind === row.kind && (!c.archivedAt || c.id === row.categoryId))
                                        .map((c) => ({ value: c.id, label: c.name }))}
                                    defaultValue={row.categoryId ?? ''}
                                />
                            </div>
                        )}
                        <Input label="Date" name="occurredOn" type="date" defaultValue={row.occurredOn} required />
                        <Textarea label="Note" name="note" defaultValue={row.note ?? ''} />
                        <SubmitButton className="text-sm">Save changes</SubmitButton>
                    </ActionForm>
                </Card>
                <AttachmentsPanel userId={user.id} entityType="transaction" entityId={row.id} page={`/transactions/${row.id}`} title="Receipts & files" />
                </div>
                <Card className="self-start">
                    <CardTitle>Summary</CardTitle>
                    <Money minor={row.amountMinor} currency={account.currency} signed colored className="block text-heading-3 font-bold" />
                    <div className="mt-1 text-body-2 text-body-muted">
                        {account.name} · {formatDate(row.occurredOn)}
                    </div>
                    <div className="mt-6 space-y-3 border-t border-light-300 pt-4 dark:border-dark-light/30">
                        <form action={setTransactionReversed.bind(null, row.id, !reversed)}>
                            <Button variant="outline" className="w-full text-sm">
                                {reversed ? 'Restore' : 'Reverse (keep in history)'}
                            </Button>
                        </form>
                        <ConfirmButton
                            action={deleteEntry.bind(null, row.id)}
                            label={transfer ? 'Delete transfer' : 'Delete entry'}
                            warning={transfer ? 'Both sides of the transfer will be removed.' : 'This can’t be undone.'}
                        />
                    </div>
                </Card>
            </div>
        </>
    );
}
