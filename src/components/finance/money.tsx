import cn from 'classnames';
import { formatMoney } from '@/lib/money';

export default function Money({
    minor,
    currency,
    signed,
    colored,
    className,
}: {
    minor: number;
    currency: string;
    signed?: boolean;
    colored?: boolean;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'tabular-nums',
                colored && minor > 0 && 'text-success-dark',
                colored && minor < 0 && 'text-danger-dark dark:text-danger',
                className
            )}
        >
            {formatMoney(minor, currency, { signed })}
        </span>
    );
}
