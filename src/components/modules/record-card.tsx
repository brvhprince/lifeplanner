import cn from 'classnames';
import Link from '@/components/ui/link';
import { Badge } from '@/components/ui/card';
import ProgressBar from '@/components/ui/progress-bar';
import { formatField } from '@/components/modules/format';
import { statusOf } from '@/lib/modules/definitions';
import type { ModuleDef } from '@/lib/modules/types';
import type { RecordRow } from '@/server/modules/registry';

export default function RecordCard({
    def,
    record,
    names,
    progress,
    coverId,
}: {
    def: ModuleDef;
    record: RecordRow;
    names: Map<string, string>;
    /** Optional progress bar, e.g. goal savings or loan repayment. */
    progress?: { value: number; max: number; label: string };
    coverId?: string;
}) {
    const status = statusOf(def, record.status);
    const summary = def.fields
        .filter((f) => f.summary)
        .map((f) => ({ field: f, text: formatField(f, record, names) }))
        .filter((s) => s.text);
    const longText = summary.find((s) => s.field.type === 'textarea');

    return (
        <Link
            href={`/${def.key}/${record.id}`}
            className="flex h-full flex-col overflow-hidden rounded-xl border border-light-300 bg-white p-5 shadow-small transition-colors hover:border-brand dark:border-dark-light/30 dark:bg-dark"
        >
            {coverId && (
                // eslint-disable-next-line @next/next/no-img-element -- authenticated file route
                <img src={`/files/${coverId}`} alt="" loading="lazy" className="-mx-5 -mt-5 mb-4 aspect-[16/9] w-[calc(100%+2.5rem)] max-w-none object-cover" />
            )}
            <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words font-semibold text-heading-dark dark:text-heading-light">
                    {record.pinned ? '📌 ' : ''}
                    {String(record[def.titleField])}
                </h3>
                {status && <Badge tone={status.tone}>{status.label}</Badge>}
            </div>

            {longText && <p className="mt-2 line-clamp-3 whitespace-pre-line text-body-2 text-body-muted">{longText.text}</p>}

            {summary.length > 0 && (
                <dl className={cn('mt-3 flex flex-wrap gap-x-4 gap-y-1 text-caption')}>
                    {summary
                        .filter((s) => s !== longText)
                        .map(({ field, text }) => (
                            <div key={field.name} className="flex gap-1">
                                <dt className="text-body-muted">{field.label}:</dt>
                                <dd className="font-semibold">{text}</dd>
                            </div>
                        ))}
                </dl>
            )}

            {progress && (
                <div className="mt-auto pt-4">
                    <ProgressBar value={progress.value} max={progress.max} />
                    <div className="mt-1 text-caption text-body-muted">{progress.label}</div>
                </div>
            )}
        </Link>
    );
}
