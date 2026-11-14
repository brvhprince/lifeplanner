import cn from 'classnames';
import Link from '@/components/ui/link';
import { Card, CardTitle, EmptyState } from '@/components/ui/card';
import Money from '@/components/finance/money';
import { relativeDay, type UpcomingItem } from '@/server/upcoming';
import { today } from '@/lib/dates';

export default function UpcomingCard({ items }: { items: UpcomingItem[] }) {
    const now = today();
    return (
        <Card>
            <CardTitle>Coming up</CardTitle>
            {items.length ? (
                <ul className="divide-y divide-light-300 dark:divide-dark-light/20">
                    {items.slice(0, 10).map((item) => {
                        const overdue = item.date < now;
                        return (
                            <li key={`${item.href}-${item.date}`}>
                                <Link href={item.href} className="flex items-center gap-3 py-2.5 hover:text-brand">
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-body-2 font-medium text-heading-dark dark:text-heading-light">{item.title}</div>
                                        <div className={cn('text-caption', overdue ? 'font-semibold text-danger-dark dark:text-danger' : 'text-body-muted')}>
                                            {relativeDay(item.date)}
                                            {item.time && item.time !== '00:00' ? ` · ${item.time}` : ''} · {item.detail}
                                        </div>
                                    </div>
                                    {item.amountMinor != null && item.currency && (
                                        <Money minor={item.amountMinor} currency={item.currency} className="text-body-2 font-semibold" />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <EmptyState title="Nothing due in the next 30 days">Bills, reminders, birthdays and deadlines show up here.</EmptyState>
            )}
        </Card>
    );
}
