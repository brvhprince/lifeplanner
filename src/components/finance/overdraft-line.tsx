import cn from 'classnames';
import { formatMoney } from '@/lib/money';

/**
 * One line under a balance: how much can still be spent, and how much of the
 * overdraft is in use. Renders nothing for accounts without an overdraft that
 * aren't below zero.
 */
export default function OverdraftLine({
    balanceMinor,
    overdraftLimitMinor,
    currency,
    className,
}: {
    balanceMinor: number;
    overdraftLimitMinor: number;
    currency: string;
    className?: string;
}) {
    if (!overdraftLimitMinor && balanceMinor >= 0) return null;
    const used = Math.max(0, -balanceMinor);
    const available = balanceMinor + overdraftLimitMinor;
    const over = available < 0;
    const nearLimit = !over && overdraftLimitMinor > 0 && used > 0 && available <= overdraftLimitMinor * 0.2;

    return (
        <span className={cn('block text-caption', over ? 'font-semibold text-danger-dark dark:text-danger' : nearLimit ? 'font-semibold text-warning-dark' : 'text-body-muted', className)}>
            {over
                ? `${formatMoney(-available, currency)} over ${overdraftLimitMinor ? 'the overdraft limit' : 'balance'}`
                : `${formatMoney(available, currency)} available`}
            {used > 0 && overdraftLimitMinor > 0 && !over && ` · using ${formatMoney(used, currency)} of ${formatMoney(overdraftLimitMinor, currency)} overdraft`}
            {used === 0 && overdraftLimitMinor > 0 && ` incl. ${formatMoney(overdraftLimitMinor, currency)} overdraft`}
        </span>
    );
}
