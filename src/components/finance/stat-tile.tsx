import cn from 'classnames';
import Money from '@/components/finance/money';
import { Card } from '@/components/ui/card';

/** A labelled figure that may hold one amount per currency. */
export default function StatTile({
    label,
    amounts,
    fallbackCurrency,
    colored,
    note,
}: {
    label: string;
    amounts: { currency: string; minor: number }[];
    fallbackCurrency: string;
    /** Green when positive, red when negative. */
    colored?: boolean;
    note?: React.ReactNode;
}) {
    const [first, ...rest] = amounts.length ? amounts : [{ currency: fallbackCurrency, minor: 0 }];
    return (
        <Card className="!p-5">
            <div className="text-caption font-semibold uppercase tracking-wide text-body-muted">{label}</div>
            <Money
                minor={first.minor}
                currency={first.currency}
                colored={colored}
                className={cn('mt-2 block text-heading-3 font-bold', !colored && 'text-heading-dark dark:text-heading-light')}
            />
            {rest.map((a) => (
                <Money key={a.currency} minor={a.minor} currency={a.currency} colored={colored} className="block text-body-2 font-semibold" />
            ))}
            {note && <div className="mt-1 text-caption text-body-muted">{note}</div>}
        </Card>
    );
}
