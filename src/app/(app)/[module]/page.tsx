import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import cn from 'classnames';
import Link from '@/components/ui/link';
import { Card, CardTitle, EmptyState, PageHeader } from '@/components/ui/card';
import RecordCard from '@/components/modules/record-card';
import RecordForm from '@/components/modules/record-form';
import { requireUser } from '@/server/auth/session';
import { countByStatus, formOptions, goalProgress, listRecords } from '@/server/modules/registry';
import { saveRecord } from '@/server/modules/actions';
import { coverImages } from '@/server/files';
import { getModule } from '@/lib/modules/definitions';

type Props = { params: Promise<{ module: string }>; searchParams: Promise<{ status?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    return { title: getModule((await params).module)?.title ?? 'Not found' };
}

export default async function ModulePage({ params, searchParams }: Props) {
    const def = getModule((await params).module);
    if (!def) notFound();
    const user = await requireUser();

    const requested = (await searchParams).status;
    const status = def.statuses?.some((s) => s.value === requested) ? requested : undefined;
    const records = listRecords(def, user.id, { status });
    const counts = countByStatus(def, user.id);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const options = formOptions(user.id);
    const covers = coverImages(user.id, def.key, records.map((r) => r.id));
    const progress = def.extension === 'goal' ? goalProgress(user.id, records.map((r) => r.id)) : null;

    return (
        <>
            <PageHeader title={def.title} subtitle={def.description} />

            {def.statuses && total > 0 && (
                <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2 text-sm font-semibold">
                    {[{ value: undefined, label: 'All', count: total }, ...def.statuses.map((s) => ({ ...s, count: counts[s.value] ?? 0 }))]
                        .filter((s) => s.value === undefined || s.count > 0)
                        .map((s) => (
                            <Link
                                key={s.value ?? 'all'}
                                href={s.value ? `/${def.key}?status=${s.value}` : `/${def.key}`}
                                className={cn(
                                    'rounded-full px-3 py-1.5',
                                    status === s.value
                                        ? 'bg-brand text-white'
                                        : 'bg-white text-body-light hover:bg-grey-200 dark:bg-dark dark:text-body-dark dark:hover:bg-dark-light/30'
                                )}
                            >
                                {s.label} <span className="opacity-70">{s.count}</span>
                            </Link>
                        ))}
                </nav>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <div>
                    {records.length ? (
                        <ul className="grid gap-4 sm:grid-cols-2">
                            {records.map((r) => (
                                <li key={r.id}>
                                    <RecordCard def={def} record={r} names={options.names} coverId={covers.get(r.id)} progressMinor={progress ? (progress.get(r.id) ?? 0) : undefined} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title={status ? 'Nothing here' : `No ${def.title.toLowerCase()} yet`}>
                            {status ? 'Try another filter.' : 'Add the first one with the form.'}
                        </EmptyState>
                    )}
                </div>
                <Card className="self-start">
                    <CardTitle>New {def.singular.toLowerCase()}</CardTitle>
                    <RecordForm
                        def={def}
                        action={saveRecord.bind(null, def.key, null)}
                        options={options}
                        defaultCurrency={user.currency}
                        submitLabel={`Add ${def.singular.toLowerCase()}`}
                    />
                </Card>
            </div>
        </>
    );
}
