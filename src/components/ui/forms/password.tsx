/**
 * Project: lifeplanner-webapp
 * File: password
 * Created by pennycodes on 10/08/2023.
 * Copyright lifeplanner-webapp
 */
'use client';

import { useState, forwardRef } from 'react';
import { BsEyeFill as EyeIcon, BsEyeSlashFill as EyeCloseIcon } from 'react-icons/bs';
import { useFormField } from '@/components/ui/forms/action-form';
import { fieldClass, FieldMessages } from '@/components/ui/forms/field-styles';

type InputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
    label: string;
    error?: string;
    className?: string;
    helpText?: string;
    inputClassName?: string;
};

const Password = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, helpText, inputClassName = '', ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const field = useFormField(props.name);
        const fieldError = error ?? field.error;

        return (
            <div className={className}>
                <label className="block text-label font-medium">
                    {label && (
                        <span className="block cursor-pointer pb-1.5 text-body-light dark:text-body-dark">{label}</span>
                    )}

                    <span className="relative block">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            ref={ref}
                            aria-invalid={fieldError ? true : undefined}
                            {...props}
                            className={fieldClass(
                                { error: fieldError, muted: props.disabled || props.readOnly },
                                inputClassName
                            )}
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-0 flex h-full w-[34px] cursor-pointer items-center justify-start text-body-light hover:text-secondary-dark dark:text-body-dark hover:dark:text-light-900 lg:w-9"
                        >
                            {showPassword ? <EyeCloseIcon className="h-auto w-5" /> : <EyeIcon className="h-auto w-5" />}
                        </button>
                    </span>
                </label>
                <FieldMessages error={fieldError} helpText={helpText} />
            </div>
        );
    }
);

Password.displayName = 'Password';
export default Password;
