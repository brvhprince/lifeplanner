import type { Metadata } from 'next';
import Link from '@/components/ui/link';
import Highlight from '@/components/ui/highlight';
import { Card, CardTitle, EmptyState, PageHeader } from '@/components/ui/card';
import { requireUser } from '@/server/auth/session';
import { search } from '@/server/search';
import { normalizeQuery } from '@/lib/validate';

export const metadata: Metadata = { title: 'Search' };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
    const user = await requireUser();
    const raw = (await searchParams).q;
    const query = normalizeQuery(Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? ''));
    const groups = search(user.id, query);
    const total = groups.reduce((n, g) => n + g.hits.length, 0);

    return (
        <>
            <PageHeader
                title={query ? <>Results for “{query}”</> : 'Search'}
                subtitle={query.length < 2 ? 'Type at least two characters.' : total ? `${total} match${total === 1 ? '' : 'es'}` : undefined}
            />
            {query.length >= 2 && !total && (
                <EmptyState title="Nothing found">Try a different word, or check the spelling.</EmptyState>
            )}
            <div className="grid gap-6 lg:grid-cols-2">
                {groups.map((group) => (
                    <Card key={group.label}>
                        <CardTitle>{group.label}</CardTitle>
                        <ul className="divide-y divide-light-300 dark:divide-dark-light/20">
                            {group.hits.map((hit, i) => (
                                <li key={`${hit.href}-${i}`}>
                                    <Link href={hit.href} className="block py-2.5 hover:text-brand">
                                        <span className="block truncate text-body-2 font-medium text-heading-dark dark:text-heading-light">
                                            <Highlight text={hit.title} query={query} />
                                        </span>
                                        {hit.detail && <span className="block text-caption text-body-muted">{hit.detail}</span>}
                                        {hit.snippet && (
                                            <span className="mt-0.5 block text-caption text-body-light dark:text-body-dark">
                                                <Highlight text={hit.snippet} query={query} />
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Card>
                ))}
            </div>
        </>
    );
}
