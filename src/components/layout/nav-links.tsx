'use client';

import type { IconType } from 'react-icons';
import {
    HiOutlineArrowPath,
    HiOutlineArrowsRightLeft,
    HiOutlineArrowTrendingUp,
    HiOutlineBanknotes,
    HiOutlineBell,
    HiOutlineBookOpen,
    HiOutlineBriefcase,
    HiOutlineBuildingOffice2,
    HiOutlineCalendarDays,
    HiOutlineChartBar,
    HiOutlineCog6Tooth,
    HiOutlineCreditCard,
    HiOutlineFlag,
    HiOutlineGift,
    HiOutlineHeart,
    HiOutlineHome,
    HiOutlineMap,
    HiOutlinePencilSquare,
    HiOutlineScale,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
    HiOutlineTag,
    HiOutlineUsers,
} from 'react-icons/hi2';
import ActiveLink from '@/components/ui/links/active-link';
import { MODULE_GROUPS, MODULES } from '@/lib/modules/definitions';
import routes from '@/config/routes';

const MODULE_ICONS: Record<string, IconType> = {
    repeat: HiOutlineArrowPath,
    flag: HiOutlineFlag,
    piggy: HiOutlineBanknotes,
    scale: HiOutlineScale,
    chart: HiOutlineChartBar,
    gift: HiOutlineGift,
    compass: HiOutlineMap,
    briefcase: HiOutlineBriefcase,
    book: HiOutlineBookOpen,
    trending: HiOutlineArrowTrendingUp,
    sparkles: HiOutlineSparkles,
    note: HiOutlinePencilSquare,
    heart: HiOutlineHeart,
    users: HiOutlineUsers,
    shield: HiOutlineShieldCheck,
    building: HiOutlineBuildingOffice2,
    bell: HiOutlineBell,
    calendar: HiOutlineCalendarDays,
};

type Item = { href: string; label: string; icon: IconType };

const FINANCE: Item[] = [
    { href: routes.accounts, label: 'Accounts', icon: HiOutlineCreditCard },
    { href: routes.transactions, label: 'Transactions', icon: HiOutlineArrowsRightLeft },
    { href: routes.categories, label: 'Categories', icon: HiOutlineTag },
];

const SECTIONS: { label?: string; items: Item[] }[] = [
    { items: [{ href: routes.home, label: 'Dashboard', icon: HiOutlineHome }] },
    ...MODULE_GROUPS.map((g) => ({
        label: g.label,
        items: [
            ...(g.key === 'money' ? FINANCE : []),
            ...MODULES.filter((m) => m.group === g.key).map((m) => ({ href: `/${m.key}`, label: m.title, icon: MODULE_ICONS[m.icon] })),
        ],
    })),
    { items: [{ href: routes.settings, label: 'Settings', icon: HiOutlineCog6Tooth }] },
];

const linkClass =
    'flex shrink-0 items-center gap-3 rounded-lg px-3 py-1.5 text-body-2 font-medium text-body-light transition-colors hover:bg-grey-200 dark:text-body-dark dark:hover:bg-dark-light/30';
const activeClass = '!bg-brand-soft !text-brand-dark dark:!bg-brand/20 dark:!text-brand-light';

export default function NavLinks({ layout }: { layout: 'sidebar' | 'bar' }) {
    if (layout === 'bar') {
        return (
            <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
                {SECTIONS.flatMap((s) => s.items).map(({ href, label, icon: Icon }) => (
                    <ActiveLink key={href} href={href} matchNested={href !== routes.home} className={linkClass} activeClassName={activeClass}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        <span className="whitespace-nowrap">{label}</span>
                    </ActiveLink>
                ))}
            </nav>
        );
    }

    return (
        <nav aria-label="Main" className="flex flex-col gap-4">
            {SECTIONS.map((section, i) => (
                <div key={section.label ?? i} className="flex flex-col gap-0.5">
                    {section.label && (
                        <div className="px-3 pb-1 text-caption font-semibold uppercase tracking-wide text-body-muted">{section.label}</div>
                    )}
                    {section.items.map(({ href, label, icon: Icon }) => (
                        <ActiveLink key={href} href={href} matchNested={href !== routes.home} className={linkClass} activeClassName={activeClass}>
                            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                            {label}
                        </ActiveLink>
                    ))}
                </div>
            ))}
        </nav>
    );
}
