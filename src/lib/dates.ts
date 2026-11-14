/** Today's date as YYYY-MM-DD in the server's local time zone. */
export function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const currentMonth = () => today().slice(0, 7);

export function isIsoDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function formatDate(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function formatMonth(month: string) {
    return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function shiftMonth(month: string, delta: number) {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTHS: Record<string, number> = { monthly: 1, quarterly: 3, yearly: 12 };

/** Advances a YYYY-MM-DD date by one period, clamping to the end of short months. */
export function addPeriod(date: string, frequency: string) {
    const [y, m, d] = date.split('-').map(Number);
    if (frequency === 'daily' || frequency === 'weekly') {
        const next = new Date(Date.UTC(y, m - 1, d + (frequency === 'daily' ? 1 : 7)));
        return next.toISOString().slice(0, 10);
    }
    const months = MONTHS[frequency];
    if (!months) return date;
    const target = new Date(Date.UTC(y, m - 1 + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(d, lastDay));
    return target.toISOString().slice(0, 10);
}

/** First occurrence on or after `from` of a series starting at `start` (YYYY-MM-DD). */
export function nextOccurrence(start: string, frequency: string, from: string, endsOn?: string | null) {
    let current = start;
    if (frequency !== 'never') {
        for (let i = 0; current < from && i < 5000; i++) current = addPeriod(current, frequency);
    }
    if (current < from || (endsOn && current > endsOn)) return null;
    return current;
}

export function daysBetween(from: string, to: string) {
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
