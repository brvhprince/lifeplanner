/** Wraps case-insensitive occurrences of `query` in <mark>. */
export default function Highlight({ text, query }: { text: string; query: string }) {
    if (!query) return <>{text}</>;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="rounded bg-warning-soft px-0.5 text-inherit dark:bg-warning/30">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
}
