'use client';

import { useFormField } from '@/components/ui/forms/action-form';
import { fieldClass, FieldMessages } from '@/components/ui/forms/field-styles';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    error?: string;
    helpText?: string;
};

export default function Textarea({ label, error, helpText, className, ...props }: TextareaProps) {
    const field = useFormField(props.name);
    const fieldError = error ?? field.error;

    return (
        <div className={className}>
            <label className="block text-label font-medium">
                <span className="block cursor-pointer pb-1.5 text-body-light dark:text-body-dark">{label}</span>
                <textarea
                    rows={3}
                    {...props}
                    defaultValue={props.defaultValue ?? field.value}
                    className={fieldClass({ error: fieldError, muted: props.disabled }, 'mt-1 !h-auto')}
                />
            </label>
            <FieldMessages error={fieldError} helpText={helpText} />
        </div>
    );
}
