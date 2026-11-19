/**
 * Strips characters a number-only field can't contain while typing or pasting.
 * - numeric: digits only (e.g. account numbers)
 * - decimal: digits, one decimal point, thousands commas and a leading minus
 *   (what toMinor accepts)
 */
export function sanitizeNumeric(value: string, mode: 'numeric' | 'decimal') {
    if (mode === 'numeric') return value.replace(/\D/g, '');
    const kept = value.replace(/[^\d.,-]/g, '');
    const sign = kept.startsWith('-') ? '-' : '';
    const unsigned = kept.replace(/-/g, '');
    const dot = unsigned.indexOf('.');
    return sign + (dot < 0 ? unsigned : unsigned.slice(0, dot + 1) + unsigned.slice(dot + 1).replace(/\./g, ''));
}
