import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/dates';
import type { FieldDef } from '@/lib/modules/types';

/** Human-readable value of a record field, or null when empty. */
export function formatField(field: FieldDef, record: Record<string, unknown>, names?: Map<string, string>): string | null {
    const value = record[field.name];
    if (value === null || value === undefined || value === '') return null;

    switch (field.type) {
        case 'money':
            return formatMoney(Number(value), String(record[field.currencyField ?? 'currency'] ?? 'USD'));
        case 'date':
            return formatDate(String(value));
        case 'datetime': {
            const d = new Date(String(value));
            return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
        }
        case 'select':
            return field.options?.find((o) => o.value === value)?.label ?? String(value);
        case 'checkbox':
            return value ? 'Yes' : null;
        case 'account':
        case 'category':
            return names?.get(String(value)) ?? null;
        default:
            return String(value);
    }
}
