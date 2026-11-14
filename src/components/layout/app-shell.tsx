import FullLogo from '@/components/ui/logo/full';
import ThemeSwitcher from '@/components/ui/theme-switcher';
import NavLinks from '@/components/layout/nav-links';
import { signOut } from '@/app/auth/actions';
import type { User } from '@/server/db/schema';
import NotificationBell from '@/components/layout/notification-bell';
import { unreadCount } from '@/server/notifications';

export default function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
    const initials = `${user.firstName[0] ?? ''}${user.otherNames[0] ?? ''}`.toUpperCase();
    const unread = unreadCount(user.id);

    return (
        <div className="min-h-screen bg-grey-100 dark:bg-dark-dark">
            <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-light-300 bg-white px-4 py-6 dark:border-dark-light/30 dark:bg-dark lg:flex">
                <div className="mb-6 flex items-center justify-between px-3">
                    <FullLogo className="w-36" />
                    <NotificationBell initialCount={unread} />
                </div>
                <div className="-mx-2 flex-1 overflow-y-auto px-2 pb-4">
                    <NavLinks layout="sidebar" />
                </div>
                <div className="flex items-center gap-3 border-t border-light-300 px-3 pt-4 dark:border-dark-light/30">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-white">
                        {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-heading-dark dark:text-heading-light">
                            {user.firstName} {user.otherNames}
                        </div>
                        <form action={signOut}>
                            <button type="submit" className="text-xs font-semibold text-brand hover:text-brand-light">
                                Sign out
                            </button>
                        </form>
                    </div>
                    <ThemeSwitcher />
                </div>
            </aside>

            <header className="sticky top-0 z-20 border-b border-light-300 bg-white/90 px-4 py-3 backdrop-blur dark:border-dark-light/30 dark:bg-dark/90 lg:hidden">
                <div className="mb-2 flex items-center justify-between">
                    <FullLogo className="w-32" />
                    <div className="flex items-center gap-3">
                        <NotificationBell initialCount={unread} />
                        <ThemeSwitcher />
                        <form action={signOut}>
                            <button type="submit" className="text-xs font-semibold text-brand">
                                Sign out
                            </button>
                        </form>
                    </div>
                </div>
                <NavLinks layout="bar" />
            </header>

            <main className="px-4 py-6 md:px-8 md:py-8 lg:ml-64 lg:px-10">
                <div className="mx-auto max-w-6xl">{children}</div>
            </main>
        </div>
    );
}
