import Select from '@/components/ui/forms/select';
import { CURRENCIES } from '@/lib/money';

const names = new Intl.DisplayNames(['en'], { type: 'currency' });
const options = CURRENCIES.map((code) => ({ value: code, label: `${code} · ${names.of(code) ?? code}` }));

export default function CurrencySelect(props: { label: string; name: string; defaultValue?: string; className?: string }) {
    return <Select {...props} options={options} />;
}
