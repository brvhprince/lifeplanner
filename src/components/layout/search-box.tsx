'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { SEARCH_MAX_LENGTH, normalizeQuery } from '@/lib/validate';

/** Search field that submits to /search. Press "/" anywhere to focus it. */
export default function SearchBox({ shortcut = false }: { shortcut?: boolean }) {
    const ref = useRef<HTMLInputElement>(null);
    const query = normalizeQuery(useSearchParams().get('q') ?? '');

    useEffect(() => {
        if (!shortcut) return;
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (e.key !== '/' || e.metaKey || e.ctrlKey || target.closest('input, textarea, select, [contenteditable]')) return;
            // Sidebar and header both render a box; only the visible one takes the shortcut.
            const input = ref.current;
            if (!input || input.getClientRects().length === 0) return;
            e.preventDefault();
            input.focus();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [shortcut]);

    return (
        <form action="/search" role="search" className="relative">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body-muted" aria-hidden="true" />
            <input
                ref={ref}
                key={query}
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search everything"
                aria-label="Search everything"
                minLength={2}
                maxLength={SEARCH_MAX_LENGTH}
                className="h-9 w-full rounded-lg border border-light-400 bg-grey-100 pl-9 pr-8 text-sm placeholder:text-body-muted focus:border-brand focus:ring-brand dark:border-dark-light/40 dark:bg-dark-dark"
            />
            {shortcut && (
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-light-500 px-1.5 text-[10px] text-body-muted dark:border-dark-light/40">
                    /
                </kbd>
            )}
        </form>
    );
}
