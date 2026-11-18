'use client';

import { useState } from 'react';
import cn from 'classnames';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import Select from '@/components/ui/forms/select';
import { createEntry } from '@/server/finance/actions';

type Kind = 'expense' | 'income' | 'transfer';

export type EntryFormAccount = { id: string; name: string; currency: string; isPrimary: boolean };
export type EntryFormCategory = { id: string; name: string; kind: 'income' | 'expense' };
export type EntryFormPerson = { id: string; name: string };

const KINDS: { value: Kind; label: string }[] = [
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
    { value: 'transfer', label: 'Transfer' },
];

export default function EntryForm({
    accounts,
    categories,
    people = [],
    today,
    defaultAccountId,
    defaultPersonId,
}: {
    accounts: EntryFormAccount[];
    categories: EntryFormCategory[];
    people?: EntryFormPerson[];
    today: string;
    defaultAccountId?: string;
    defaultPersonId?: string;
}) {
    const [kind, setKind] = useState<Kind>('expense');
    const primary = defaultAccountId ?? accounts.find((a) => a.isPrimary)?.id ?? accounts[0]?.id;
    const [accountId, setAccountId] = useState(primary);
    const [toAccountId, setToAccountId] = useState('');

    const from = accounts.find((a) => a.id === accountId);
    const to = accounts.find((a) => a.id === toAccountId);
    const crossCurrency = kind === 'transfer' && from && to && from.currency !== to.currency;

    const accountOptions = accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }));
    const categoryOptions = categories.filter((c) => c.kind === kind).map((c) => ({ value: c.id, label: c.name }));

    return (
        <ActionForm
            action={createEntry}
            className="space-y-4"
            onReset={() => {
                setAccountId(primary);
                setToAccountId('');
            }}
        >
            <input type="hidden" name="kind" value={kind} />
            <div role="tablist" aria-label="Entry type" className="grid grid-cols-3 gap-1 rounded-lg bg-grey-200 p-1 dark:bg-dark-dark">
                {KINDS.map((k) => (
                    <button
                        key={k.value}
                        type="button"
                        role="tab"
                        aria-selected={kind === k.value}
                        onClick={() => setKind(k.value)}
                        className={cn(
                            'rounded-md py-1.5 text-sm font-semibold transition-colors',
                            kind === k.value
                                ? 'bg-white text-heading-dark shadow-small dark:bg-dark dark:text-heading-light'
                                : 'text-body-muted hover:text-heading-dark dark:hover:text-heading-light'
                        )}
                    >
                        {k.label}
                    </button>
                ))}
            </div>

            <Select
                label={kind === 'transfer' ? 'From account' : 'Account'}
                name="accountId"
                options={accountOptions}
                defaultValue={primary}
                onChange={(e) => setAccountId(e.target.value)}
            />

            {kind === 'transfer' && (
                <Select
                    label="To account"
                    name="toAccountId"
                    placeholder="Choose account"
                    options={accountOptions.filter((o) => o.value !== accountId)}
                    onChange={(e) => setToAccountId(e.target.value)}
                />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <Input
                    label={`Amount${from ? ` (${from.currency})` : ''}`}
                    name="amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    required
                />
                <Input label="Date" name="occurredOn" type="date" defaultValue={today} required />
            </div>

            {crossCurrency && (
                <Input
                    label={`Amount received (${to.currency})`}
                    name="toAmount"
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    required
                />
            )}
            {kind === 'transfer' && (
                <Input label={`Fee${from ? ` (${from.currency})` : ''}`} name="fee" inputMode="decimal" placeholder="0.00" />
            )}

            {kind !== 'transfer' && (
                <Select
                    key={kind}
                    label="Category"
                    name="categoryId"
                    placeholder="Uncategorised"
                    options={categoryOptions}
                />
            )}

            {kind !== 'transfer' && people.length > 0 && (
                <Select
                    label={kind === 'income' ? 'From (optional)' : 'To (optional)'}
                    name="personId"
                    placeholder="No one in particular"
                    options={people.map((p) => ({ value: p.id, label: p.name }))}
                    defaultValue={defaultPersonId ?? ''}
                />
            )}

            <Input
                label="Description"
                name="title"
                placeholder={kind === 'income' ? 'e.g. Salary' : kind === 'expense' ? 'e.g. Groceries' : 'Optional'}
                maxLength={120}
            />

            <SubmitButton className="w-full text-sm">
                Add {KINDS.find((k) => k.value === kind)?.label.toLowerCase()}
            </SubmitButton>
        </ActionForm>
    );
}
