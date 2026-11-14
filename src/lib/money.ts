/**
 * Money helpers. Amounts are integer minor units (e.g. cents); parsing never
 * goes through floating point.
 */

const digitsCache = new Map<string, number>();

export function currencyDigits(currency: string) {
    let digits = digitsCache.get(currency);
    if (digits === undefined) {
        digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
            .maximumFractionDigits ?? 2;
        digitsCache.set(currency, digits);
    }
    return digits;
}

export function isCurrency(code: string) {
    return /^[A-Z]{3}$/.test(code) && Intl.supportedValuesOf('currency').includes(code);
}

export const CURRENCIES = Intl.supportedValuesOf('currency');

/** Parses a user-entered decimal like "1,234.5" into minor units, or null. */
export function toMinor(input: string, currency: string): number | null {
    const cleaned = input.replace(/[\s,_]/g, '');
    const match = /^(-)?(\d*)(?:\.(\d*))?$/.exec(cleaned);
    if (!match || (!match[2] && !match[3])) return null;

    const digits = currencyDigits(currency);
    const fraction = match[3] ?? '';
    if (fraction.length > digits) return null;

    const minor = Number((match[2] || '0') + fraction.padEnd(digits, '0'));
    if (!Number.isSafeInteger(minor)) return null;
    return match[1] ? -minor : minor;
}

/** Formats minor units for an input field (no symbol, no grouping). */
export function fromMinor(minor: number, currency: string) {
    const digits = currencyDigits(currency);
    const sign = minor < 0 ? '-' : '';
    const abs = String(Math.abs(minor)).padStart(digits + 1, '0');
    return digits ? `${sign}${abs.slice(0, -digits)}.${abs.slice(-digits)}` : `${sign}${abs}`;
}

export function formatMoney(minor: number, currency: string, opts: { signed?: boolean } = {}) {
    const digits = currencyDigits(currency);
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        signDisplay: opts.signed ? 'exceptZero' : 'auto',
    }).format(minor / 10 ** digits);
}
