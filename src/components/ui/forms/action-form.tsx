'use client';

import { createContext, useActionState, useContext, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import toast from 'react-hot-toast';
import type { ActionState, FormAction } from '@/lib/action-state';
import Button from '@/components/ui/button';

const FormStateContext = createContext<ActionState>({});

/** Error and last submitted value for a named field in the enclosing ActionForm. */
export function useFormField(name?: string) {
    const state = useContext(FormStateContext);
    if (!name) return {};
    return { error: state.fieldErrors?.[name], value: state.values?.[name] };
}

type ActionFormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'action'> & {
    action: FormAction;
    children: React.ReactNode;
    /** Show the form-level error banner (field errors still show inline). */
    showError?: boolean;
};

export function ActionForm({ action, children, showError = true, ...props }: ActionFormProps) {
    const [state, formAction] = useActionState(action, {});

    useEffect(() => {
        if (state.ok && state.message) toast.success(state.message);
    }, [state]);

    // A successful submission returns no `values`, so React's post-action reset
    // clears the form; a failed one echoes the values back as defaults.
    return (
        <FormStateContext.Provider value={state.ok ? {} : state}>
            <form action={formAction} noValidate {...props}>
                {showError && state.error && !state.ok && (
                    <p
                        role="alert"
                        className="mb-4 rounded-md border border-danger bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-dark"
                    >
                        {state.error}
                    </p>
                )}
                {children}
            </form>
        </FormStateContext.Provider>
    );
}

export function SubmitButton({
    children,
    className,
    variant,
}: {
    children: React.ReactNode;
    className?: string;
    variant?: React.ComponentProps<typeof Button>['variant'];
}) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" isLoading={pending} disabled={pending} className={className} variant={variant}>
            {children}
        </Button>
    );
}
