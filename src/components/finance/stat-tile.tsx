import Money from '@/components/finance/money';
import { Card } from '@/components/ui/card';

/** A labelled figure that may hold one amount per currency. */
export default function StatTile({
    label,
    amounts,
    fallbackCurrency,
    colored,
}: {
    label: string;
    amounts: { currency: string; minor: number }[];
    fallbackCurrency: string;
    colored?: boolean;
}) {
    const [first, ...rest] = amounts.length ? amounts : [{ currency: fallbackCurrency, minor: 0 }];
    return (
        <Card className="!p-5">
            <div className="text-caption font-semibold uppercase tracking-wide text-body-muted">{label}</div>
            <Money
                minor={first.minor}
                currency={first.currency}
                colored={colored}
                className="mt-2 block text-heading-3 font-bold text-heading-dark dark:text-heading-light"
            />
            {rest.map((a) => (
                <Money key={a.currency} minor={a.minor} currency={a.currency} colored={colored} className="block text-body-2 font-semibold" />
            ))}
        </Card>
    );
}
