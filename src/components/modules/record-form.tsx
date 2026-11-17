import cn from 'classnames';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import Select from '@/components/ui/forms/select';
import Textarea from '@/components/ui/forms/textarea';
import CurrencySelect from '@/components/finance/currency-select';
import type { FormAction } from '@/lib/action-state';
import type { FieldDef, ModuleDef, Option } from '@/lib/modules/types';
import { fromMinor } from '@/lib/money';

type Props = {
    def: ModuleDef;
    action: FormAction;
    record?: Record<string, unknown> | null;
    options: { accounts: Option[]; categories: Option[]; employers: Option[] };
    defaultCurrency: string;
    submitLabel: string;
    /** Show the status picker (edit forms). */
    withStatus?: boolean;
    /** Fields shown but not editable (their current value is still submitted). */
    locked?: string[];
    lockedHelp?: string;
};

function defaultFor(field: FieldDef, record: Props['record'], defaultCurrency: string) {
    const value = record ? record[field.name] : field.defaultValue;
    if (field.type === 'currency') return (value as string) ?? defaultCurrency;
    if (value === null || value === undefined) return undefined;
    if (field.type === 'money') return fromMinor(Number(value), String(record?.[field.currencyField ?? 'currency'] ?? defaultCurrency));
    return String(value);
}

function Field({ field, record, options, defaultCurrency, isLocked, lockedHelp }: { field: FieldDef; isLocked: boolean; lockedHelp?: string } & Omit<Props, 'def' | 'action' | 'submitLabel' | 'locked'>) {
    const common = { label: field.label, name: field.name, className: cn(field.full && 'sm:col-span-2') };
    const defaultValue = defaultFor(field, record, defaultCurrency);

    if (isLocked) {
        // Selects can't be read-only, so show the value and submit it hidden.
        const shown =
            field.type === 'select' ? (field.options?.find((o) => o.value === defaultValue)?.label ?? defaultValue) : defaultValue;
        return (
            <div className={common.className}>
                <input type="hidden" name={field.name} value={defaultValue ?? ''} />
                <Input label={field.label} defaultValue={shown ?? ''} readOnly helpText={lockedHelp} />
            </div>
        );
    }

    switch (field.type) {
        case 'textarea':
            return <Textarea {...common} defaultValue={defaultValue} placeholder={field.placeholder} helpText={field.help} rows={field.name === 'content' ? 10 : 3} />;
        case 'select':
            return (
                <Select
                    {...common}
                    options={field.options ?? []}
                    defaultValue={defaultValue ?? (field.required ? field.options?.[0]?.value : '')}
                    placeholder={field.required ? undefined : '—'}
                    helpText={field.help}
                />
            );
        case 'currency':
            return <CurrencySelect {...common} defaultValue={defaultValue} />;
        case 'account':
            return <Select {...common} options={options.accounts} defaultValue={defaultValue ?? ''} placeholder="None" helpText={field.help} />;
        case 'category':
            return <Select {...common} options={options.categories} defaultValue={defaultValue ?? ''} placeholder="None" helpText={field.help} />;
        case 'employer':
            return <Select {...common} options={options.employers} defaultValue={defaultValue ?? ''} placeholder="None" helpText={field.help} />;
        case 'checkbox':
            return (
                <label className={cn('flex items-center gap-2 text-body-2', common.className)}>
                    <input
                        type="checkbox"
                        name={field.name}
                        defaultChecked={Boolean(record?.[field.name])}
                        className="rounded border-input-border text-brand focus:ring-brand"
                    />
                    {field.label}
                </label>
            );
        default:
            return (
                <Input
                    {...common}
                    type={field.type === 'money' ? 'text' : field.type === 'datetime' ? 'datetime-local' : field.type}
                    inputMode={field.type === 'money' ? 'decimal' : undefined}
                    defaultValue={defaultValue}
                    placeholder={field.placeholder ?? (field.type === 'money' ? '0.00' : undefined)}
                    helpText={field.help}
                    maxLength={field.max}
                    required={field.required}
                    autoComplete="off"
                />
            );
    }
}

export default function RecordForm({ def, action, record, options, defaultCurrency, submitLabel, withStatus, locked = [], lockedHelp }: Props) {
    return (
        <ActionForm action={action} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                {def.fields.filter((field) => !(record && field.createOnly)).map((field) => (
                    <Field
                        key={field.name}
                        field={field}
                        record={record}
                        options={options}
                        defaultCurrency={defaultCurrency}
                        isLocked={locked.includes(field.name)}
                        lockedHelp={lockedHelp}
                    />
                ))}
                {withStatus && def.statuses && (
                    <Select
                        label="Status"
                        name="status"
                        options={def.statuses.map((s) => ({ value: s.value, label: s.label }))}
                        defaultValue={String(record?.status ?? def.defaultStatus)}
                    />
                )}
            </div>
            <SubmitButton className="w-full text-sm sm:w-auto">{submitLabel}</SubmitButton>
        </ActionForm>
    );
}
