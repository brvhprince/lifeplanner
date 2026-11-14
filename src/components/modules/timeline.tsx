import { HiOutlineTrash } from 'react-icons/hi2';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import Textarea from '@/components/ui/forms/textarea';
import { EmptyState } from '@/components/ui/card';
import { addTimelineEntry, deleteTimelineEntry } from '@/server/modules/actions';
import type { ModuleDef } from '@/lib/modules/types';
import type { schema } from '@/server/db';

type Entry = typeof schema.timelineEntries.$inferSelect;

export default function Timeline({ def, entityId, entries, today }: { def: ModuleDef; entityId: string; entries: Entry[]; today: string }) {
    return (
        <div className="space-y-6">
            <ActionForm action={addTimelineEntry.bind(null, def.key, entityId)} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
                    <Input label="Entry" name="title" placeholder={def.timeline?.placeholder} maxLength={300} required />
                    <Input label="Date" name="occurredOn" type="date" defaultValue={today} />
                </div>
                <Textarea label="Details (optional)" name="body" rows={2} />
                <SubmitButton className="text-sm">Add entry</SubmitButton>
            </ActionForm>

            {entries.length ? (
                <ol className="relative space-y-4 border-l border-light-400 pl-5 dark:border-dark-light/40">
                    {entries.map((e) => (
                        <li key={e.id} className="relative">
                            <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" />
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-caption text-body-muted">
                                        {e.occurredAt.toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </div>
                                    <div className="font-medium text-heading-dark dark:text-heading-light">{e.title}</div>
                                    {e.body && <div className="mt-1 whitespace-pre-line text-body-2">{e.body}</div>}
                                </div>
                                <form action={deleteTimelineEntry.bind(null, def.key, e.id)}>
                                    <button
                                        type="submit"
                                        aria-label={`Delete entry ${e.title}`}
                                        className="rounded p-1.5 text-body-muted hover:bg-grey-200 hover:text-danger-dark dark:hover:bg-dark-light/30"
                                    >
                                        <HiOutlineTrash className="h-4 w-4" />
                                    </button>
                                </form>
                            </div>
                        </li>
                    ))}
                </ol>
            ) : (
                <EmptyState title="Nothing logged yet" />
            )}
        </div>
    );
}
