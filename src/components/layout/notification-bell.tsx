'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { HiOutlineBell } from 'react-icons/hi2';
import Link from '@/components/ui/link';

/**
 * Bell with the unread count, refreshed every minute and on navigation.
 * Alerts themselves arrive as push notifications (see Settings).
 */
export default function NotificationBell({ initialCount }: { initialCount: number }) {
    const [count, setCount] = useState(initialCount);
    const [prevInitial, setPrevInitial] = useState(initialCount);
    const pathname = usePathname();

    // A server render (e.g. after "mark all read") brings a fresh count.
    if (prevInitial !== initialCount) {
        setPrevInitial(initialCount);
        setCount(initialCount);
    }

    useEffect(() => {
        let stopped = false;
        async function poll() {
            try {
                const res = await fetch('/api/notifications', { cache: 'no-store' });
                if (res.ok && !stopped) setCount((await res.json()).count);
            } catch {
                // Offline or server restarting; try again next tick.
            }
        }
        poll();
        const timer = setInterval(poll, 60_000);
        return () => {
            stopped = true;
            clearInterval(timer);
        };
    }, [pathname]);

    return (
        <Link
            href="/notifications"
            title="Notifications"
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-body-light hover:bg-grey-200 dark:text-body-dark dark:hover:bg-dark-light/30"
        >
            <HiOutlineBell className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Notifications{count ? `, ${count} unread` : ''}</span>
            {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-[18px] text-white">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </Link>
    );
}
