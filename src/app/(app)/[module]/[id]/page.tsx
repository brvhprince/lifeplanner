import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from '@/components/ui/link';
import { Badge, Card, CardTitle, PageHeader } from '@/components/ui/card';
import ConfirmButton from '@/components/ui/confirm-button';
import RecordForm from '@/components/modules/record-form';
import Timeline from '@/components/modules/timeline';
import AttachmentsPanel from '@/components/files/attachments-panel';
import { DebtPanel, EmployerPanel, GoalPanel, SchedulePanel, SubscriptionPanel } from '@/components/modules/extensions';
import { requireUser } from '@/server/auth/session';
import { formOptions, getRecord, listTimeline } from '@/server/modules/registry';
import { deleteRecord, saveRecord } from '@/server/modules/actions';
import { getModule, statusOf } from '@/lib/modules/definitions';
import { today } from '@/lib/dates';

type Props = { params: Promise<{ module: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    return { title: getModule((await params).module)?.singular ?? 'Not found' };
}

export default async function RecordPage({ params }: Props) {
    const { module, id } = await params;
    const def = getModule(module);
    if (!def) notFound();
    const user = await requireUser();
    const record = getRecord(def, user.id, id);
    if (!record) notFound();

    const status = statusOf(def, record.status);
    const options = formOptions(user.id);

    const panel =
        def.extension === 'goal' ? (
            <GoalPanel goal={record} userId={user.id} />
        ) : def.extension === 'subscription' ? (
            <SubscriptionPanel sub={record} userId={user.id} />
        ) : def.extension === 'debt' ? (
            <DebtPanel debt={record} />
        ) : def.extension === 'schedule' ? (
            <SchedulePanel schedule={record} userId={user.id} />
        ) : def.extension === 'employer' ? (
            <EmployerPanel employer={record} userId={user.id} />
        ) : null;

    const editor = (
        <Card className="self-start">
            <CardTitle>Details</CardTitle>
            {/* Remount when the record changes elsewhere (e.g. a payment moves the due date). */}
            <RecordForm
                key={record.updatedAt.getTime()}
                def={def}
                action={saveRecord.bind(null, def.key, record.id)}
                record={record}
                options={options}
                defaultCurrency={user.currency}
                submitLabel="Save changes"
                withStatus
            />
            <div className="mt-6 border-t border-light-300 pt-4 dark:border-dark-light/30">
                <ConfirmButton action={deleteRecord.bind(null, def.key, record.id)} label={`Delete ${def.singular.toLowerCase()}`} />
            </div>
        </Card>
    );

    return (
        <>
            <PageHeader
                title={
                    <span className="flex flex-wrap items-center gap-3">
                        {String(record[def.titleField])}
                        {status && <Badge tone={status.tone}>{status.label}</Badge>}
                    </span>
                }
                subtitle={
                    <Link href={`/${def.key}`} className="hover:text-brand">
                        ← {def.title}
                    </Link>
                }
            />
            <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                <div className="space-y-6">
                    {panel}
                    {def.timeline && (
                        <Card>
                            <CardTitle>{def.timeline.label}</CardTitle>
                            <Timeline def={def} entityId={record.id} entries={listTimeline(user.id, def.key, record.id)} today={today()} />
                        </Card>
                    )}
                    <AttachmentsPanel userId={user.id} entityType={def.key} entityId={record.id} page={`/${def.key}/${record.id}`} />
                </div>
                {editor}
            </div>
        </>
    );
}
