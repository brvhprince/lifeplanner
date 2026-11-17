import type { Metadata } from 'next';
import cn from 'classnames';
import { Card, CardTitle, EmptyState, PageHeader } from '@/components/ui/card';
import Button from '@/components/ui/button';
import PushSettings from '@/components/layout/push-settings';
import Link from '@/components/ui/link';
import { vapidKeys } from '@/server/push';
import { requireUser } from '@/server/auth/session';
import { listNotifications } from '@/server/notifications';
import { markAllRead, openNotification } from '@/server/notification-actions';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
    const user = await requireUser();
    const items = listNotifications(user.id);
    const unread = items.filter((i) => !i.readAt).length;

    return (
        <>
            <PageHeader
                title="Notifications"
                subtitle={unread ? `${unread} unread` : 'All caught up'}
                actions={
                    unread > 0 && (
                        <form action={markAllRead}>
                            <Button variant="outline" className="text-sm">
                                Mark all as read
                            </Button>
                        </form>
                    )
                }
            />
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <Card>
                    {items.length ? (
                        <ul className="divide-y divide-light-300 dark:divide-dark-light/20">
                            {items.map((item) => (
                                <li key={item.id}>
                                    <form action={openNotification.bind(null, item.id)}>
                                        <button type="submit" className="flex w-full items-start gap-3 py-3 text-left hover:text-brand">
                                            <span
                                                aria-hidden="true"
                                                className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', item.readAt ? 'bg-transparent' : 'bg-brand')}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className={cn('block text-body-2 text-heading-dark dark:text-heading-light', !item.readAt && 'font-semibold')}>
                                                    {item.title}
                                                    {!item.readAt && <span className="sr-only"> (unread)</span>}
                                                </span>
                                                {item.body && <span className="block text-caption text-body-muted">{item.body}</span>}
                                            </span>
                                            <span className="shrink-0 text-caption text-body-muted">
                                                {item.createdAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                            </span>
                                        </button>
                                    </form>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="No notifications yet">Due bills, reminders, birthdays and deadlines will appear here.</EmptyState>
                    )}
                </Card>
                <Card className="self-start">
                    <CardTitle>On your phone</CardTitle>
                    <PushSettings publicKey={vapidKeys().publicKey} />
                    <p className="mt-4 text-caption text-body-muted">
                        Choose how far ahead you’re reminded in{' '}
                        <Link href="/settings" className="font-semibold text-brand">
                            Settings
                        </Link>
                        .
                    </p>
                </Card>
            </div>
        </>
    );
}
