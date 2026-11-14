import Link from '@/components/ui/link';

export default function Pager({ page, hasMore, base, query = {} }: { page: number; hasMore: boolean; base: string; query?: Record<string, string> }) {
    if (page === 1 && !hasMore) return null;
    const href = (p: number) => `${base}?${new URLSearchParams({ ...query, page: String(p) })}`;
    return (
        <div className="mt-6 flex justify-between text-sm font-semibold">
            {page > 1 ? (
                <Link href={href(page - 1)} className="text-brand">
                    ← Newer
                </Link>
            ) : (
                <span />
            )}
            {hasMore && (
                <Link href={href(page + 1)} className="text-brand">
                    Older →
                </Link>
            )}
        </div>
    );
}
