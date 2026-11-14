'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { HiOutlineBell } from 'react-icons/hi2';
import Link from '@/components/ui/link';

type Latest = { id: string; title: string; body: string | null; href: string | null };

const SEEN_KEY = 'lp-notified-ids';

function readSeen(): Set<string> {
    try {
        return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]'));
    } catch {
        return new Set();
    }
}

function writeSeen(ids: Set<string>) {
    try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-200)));
    } catch {
        // Storage unavailable (private mode); desktop alerts may repeat, which is acceptable.
    }
}

/**
 * Bell with the unread count. Polls every minute and, if the user allowed it,
 * shows a desktop notification for anything new while the app is open.
 */
export default function NotificationBell({ initialCount }: { initialCount: number }) {
    const [count, setCount] = useState(initialCount);
    const [prevInitial, setPrevInitial] = useState(initialCount);
    const first = useRef(true);
    const router = useRouter();
    // Re-check on every navigation, e.g. right after opening a notification.
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
                if (!res.ok || stopped) return;
                const data: { count: number; latest: Latest[] } = await res.json();
                setCount(data.count);

                const seen = readSeen();
                const fresh = data.latest.filter((l) => !seen.has(l.id));
                // Don't replay old unread items as alerts on the first load.
                if (!first.current && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    for (const item of fresh) {
                        const alert = new Notification(item.title, { body: item.body ?? undefined, tag: item.id });
                        alert.onclick = () => {
                            window.focus();
                            router.push('/notifications');
                        };
                    }
                }
                fresh.forEach((l) => seen.add(l.id));
                writeSeen(seen);
                first.current = false;
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
    }, [router, pathname]);

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
