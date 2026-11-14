'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import Button from '@/components/ui/button';

function Submit({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="solidDanger" isLoading={pending} disabled={pending} className="text-sm">
            {label}
        </Button>
    );
}

/** Two-step destructive action without a browser dialog. */
export default function ConfirmButton({
    action,
    label = 'Delete',
    confirmLabel = 'Yes, delete',
    warning = 'This can’t be undone.',
}: {
    action: () => Promise<void>;
    label?: string;
    confirmLabel?: string;
    warning?: string;
}) {
    const [armed, setArmed] = useState(false);
    if (!armed) {
        return (
            <Button type="button" variant="outline" className="text-sm" onClick={() => setArmed(true)}>
                {label}
            </Button>
        );
    }
    return (
        <form action={action} className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-danger-dark">{warning}</span>
            <Submit label={confirmLabel} />
            <Button type="button" variant="text" className="text-sm" onClick={() => setArmed(false)}>
                Cancel
            </Button>
        </form>
    );
}
