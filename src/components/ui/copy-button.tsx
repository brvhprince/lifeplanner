'use client';

import { useState } from 'react';

/** Copies `text` to the clipboard and briefly confirms it. */
export default function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
    const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    return (
        <button
            type="button"
            onClick={async () => {
                let result: 'copied' | 'failed' = 'copied';
                try {
                    await navigator.clipboard.writeText(text);
                } catch {
                    // No clipboard access (e.g. the app served over plain HTTP).
                    result = 'failed';
                }
                setStatus(result);
                setTimeout(() => setStatus('idle'), result === 'failed' ? 4000 : 1500);
            }}
            className="rounded-md border border-light-300 px-2 py-0.5 text-caption font-semibold text-body-muted transition-colors hover:border-brand hover:text-brand dark:border-dark-light/30"
        >
            <span aria-live="polite">{status === 'copied' ? 'Copied' : status === 'failed' ? 'Couldn’t copy: select the number instead' : label}</span>
        </button>
    );
}
