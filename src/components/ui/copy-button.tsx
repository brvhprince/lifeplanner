'use client';

import { useState } from 'react';

/** Copies `text` to the clipboard and briefly confirms it. */
export default function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            onClick={async () => {
                try {
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                } catch {
                    // Clipboard unavailable (e.g. plain HTTP); the number is still visible to select.
                }
            }}
            className="rounded-md border border-light-300 px-2 py-0.5 text-caption font-semibold text-body-muted transition-colors hover:border-brand hover:text-brand dark:border-dark-light/30"
        >
            <span aria-live="polite">{copied ? 'Copied' : label}</span>
        </button>
    );
}
