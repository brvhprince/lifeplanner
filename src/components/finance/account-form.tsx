import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import Select from '@/components/ui/forms/select';
import CurrencySelect from '@/components/finance/currency-select';
import { createAccount } from '@/server/finance/actions';

const TYPE_OPTIONS = [
    { value: 'bank', label: 'Bank account' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'mobile', label: 'Mobile money' },
];

export default function AccountForm({ currency }: { currency: string }) {
    return (
        <ActionForm action={createAccount} className="space-y-4">
            <Input label="Name" name="name" placeholder="e.g. Main bank" maxLength={100} required />
            <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Type" name="type" options={TYPE_OPTIONS} defaultValue="bank" />
                <CurrencySelect label="Currency" name="currency" defaultValue={currency} />
            </div>
            <Input
                label="Current balance"
                name="openingBalance"
                inputMode="decimal"
                placeholder="0.00"
                helpText="What the account holds today. Later balances come from your entries."
            />
            <label className="flex items-center gap-2 text-body-2">
                <input type="checkbox" name="isPrimary" className="rounded border-input-border text-brand focus:ring-brand" />
                Make this my primary account
            </label>
            <SubmitButton className="w-full text-sm">Create account</SubmitButton>
        </ActionForm>
    );
}
