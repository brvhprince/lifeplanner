import cn from 'classnames';
import type { Tone } from '@/lib/modules/types';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <section
            className={cn(
                'rounded-xl border border-light-300 bg-white p-5 shadow-small dark:border-dark-light/30 dark:bg-dark md:p-6',
                className
            )}
        >
            {children}
        </section>
    );
}

export function CardTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-heading-5 font-semibold text-heading-dark dark:text-heading-light">{children}</h2>
            {action}
        </div>
    );
}

export function PageHeader({
    title,
    subtitle,
    actions,
}: {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
            <div>
                <h1 className="text-heading-2 font-semibold leading-tight text-heading-dark dark:text-heading-light">
                    {title}
                </h1>
                {subtitle && <div className="mt-1 text-body-2 text-body-muted">{subtitle}</div>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-dashed border-light-500 px-6 py-10 text-center dark:border-dark-light/40">
            <div className="font-semibold text-heading-dark dark:text-heading-light">{title}</div>
            {children && <div className="mt-1 text-body-2 text-body-muted">{children}</div>}
        </div>
    );
}

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: Tone }) {
    return (
        <span
            className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-caption font-semibold', {
                'bg-grey-200 text-grey-700 dark:bg-dark-light/30 dark:text-light-500': tone === 'neutral',
                'bg-brand-soft text-brand-dark dark:bg-brand/20 dark:text-brand-light': tone === 'brand',
                'bg-success-soft text-success-dark dark:bg-success/20 dark:text-success-light': tone === 'success',
                'bg-warning-soft text-warning-dark dark:bg-warning/20 dark:text-warning-light': tone === 'warning',
                'bg-danger-soft text-danger-dark dark:bg-danger/20 dark:text-danger-light': tone === 'danger',
            })}
        >
            {children}
        </span>
    );
}
