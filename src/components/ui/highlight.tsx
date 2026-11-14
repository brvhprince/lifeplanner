import { findMatches } from '@/lib/fold';

/** Marks the parts of `text` that match `query`, using the same folding as search. */
export default function Highlight({ text, query }: { text: string; query: string }) {
    const ranges = query ? findMatches(text, query) : [];
    if (!ranges.length) return <>{text}</>;

    const parts: React.ReactNode[] = [];
    let cursor = 0;
    ranges.forEach(([start, end], i) => {
        if (start > cursor) parts.push(text.slice(cursor, start));
        parts.push(
            <mark key={i} className="rounded bg-warning-soft px-0.5 text-inherit dark:bg-warning/30">
                {text.slice(start, end)}
            </mark>
        );
        cursor = end;
    });
    if (cursor < text.length) parts.push(text.slice(cursor));
    return <>{parts}</>;
}
