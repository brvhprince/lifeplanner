/**
 * Project: lifeplanner-webapp
 * File: input
 * Created by pennycodes on 10/08/2023.
 * Copyright lifeplanner-webapp
 */
'use client';

import { forwardRef, ReactNode } from 'react';
import classNames from 'classnames';
import useMaxlength from '@/utils/hooks/use-maxlength';
import { BsDashCircleFill } from 'react-icons/bs';
import { useFormField } from '@/components/ui/forms/action-form';
import { fieldClass, FieldMessages } from '@/components/ui/forms/field-styles';
import { sanitizeNumeric } from '@/lib/numeric-input';

/** Removes characters a number-only field can't take, keeping the caret in place. */
function keepNumeric(input: HTMLInputElement, mode: 'numeric' | 'decimal') {
    const clean = sanitizeNumeric(input.value, mode);
    if (clean === input.value) return;
    const caret = sanitizeNumeric(input.value.slice(0, input.selectionStart ?? input.value.length), mode).length;
    input.value = clean;
    input.setSelectionRange(caret, caret);
}

type InputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
    label: string;
    error?: string;
    helpText?: string;
    icon?: ReactNode;
    className?: string;
    inputClassName?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, icon, error, helpText, type = 'text', className, inputClassName = '', required, ...props }, ref) => {
        const field = useFormField(props.name);
        const fieldError = error ?? field.error;
        const defaultValue = props.defaultValue ?? (type === 'password' ? undefined : field.value);
        const numericMode = props.inputMode === 'decimal' || props.inputMode === 'numeric' ? props.inputMode : null;

        const { isLimitExceeded, isLimitReached, counter, isShowCounter, isWarning } = useMaxlength({
            maxLength: props.maxLength,
            value: defaultValue as string | undefined,
            validate: true,
        });

        return (
            <div className={className}>
                <label className="block text-label font-medium">
                    {label && (
                        <span className="block cursor-pointer pb-1.5 text-body-light dark:text-body-dark">
                            {label}{' '}
                            {required && <small className="text-xs font-semibold text-red-500">required</small>}
                        </span>
                    )}
                    <div className="relative mt-1 rounded-md shadow-sm">
                        {icon && (
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                {icon}
                            </div>
                        )}
                        <input
                            type={type}
                            ref={ref}
                            required={required}
                            aria-invalid={fieldError ? true : undefined}
                            {...props}
                            onInput={(e) => {
                                if (numericMode) keepNumeric(e.currentTarget, numericMode);
                                props.onInput?.(e);
                            }}
                            defaultValue={defaultValue}
                            className={fieldClass(
                                { error: fieldError, muted: props.disabled || props.readOnly },
                                inputClassName
                            )}
                        />
                        <span
                            className={classNames('pointer-events-none absolute -bottom-5 right-0 flex items-center pl-3', {
                                'text-red-500': isLimitExceeded || isLimitReached,
                                'text-brand-warning': isWarning,
                                'text-brand-green': !isLimitExceeded && !isLimitReached,
                            })}
                        >
                            {isShowCounter && (
                                <span className="text-xs">
                                    {counter}/{props.maxLength}
                                </span>
                            )}
                        </span>
                        {fieldError && (
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <BsDashCircleFill className="h-5 w-5 text-danger" aria-hidden="true" />
                            </div>
                        )}
                    </div>
                </label>
                <FieldMessages error={fieldError} helpText={helpText} />
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
