'use client';

import { useFormField } from '@/components/ui/forms/action-form';
import { fieldClass, FieldMessages } from '@/components/ui/forms/field-styles';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    error?: string;
    helpText?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
};

export default function Select({ label, error, helpText, options, placeholder, className, ...props }: SelectProps) {
    const field = useFormField(props.name);
    const fieldError = error ?? field.error;
    // `key` remounts the element so an echoed value replaces the default after an error.
    const defaultValue = field.value ?? props.defaultValue;

    return (
        <div className={className}>
            <label className="block text-label font-medium">
                <span className="block cursor-pointer pb-1.5 text-body-light dark:text-body-dark">{label}</span>
                <select
                    key={String(defaultValue ?? '')}
                    aria-invalid={fieldError ? true : undefined}
                    {...props}
                    defaultValue={defaultValue}
                    className={fieldClass({ error: fieldError, muted: props.disabled }, 'mt-1 pr-10 dark:bg-dark')}
                >
                    {placeholder !== undefined && <option value="">{placeholder}</option>}
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </label>
            <FieldMessages error={fieldError} helpText={helpText} />
        </div>
    );
}
