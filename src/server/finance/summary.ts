import 'server-only';
import { listAccounts, monthTotals } from '@/server/finance/queries';

type Amount = { currency: string; minor: number };

/** Orders per-currency amounts with the user's main currency first. */
function sortAmounts(amounts: Map<string, number>, mainCurrency: string): Amount[] {
    return [...amounts.entries()]
        .map(([currency, minor]) => ({ currency, minor }))
        .sort((a, b) => (a.currency === mainCurrency ? -1 : b.currency === mainCurrency ? 1 : a.currency.localeCompare(b.currency)));
}

export function financeSummary(userId: string, mainCurrency: string, month: string) {
    const accounts = listAccounts(userId);

    const net = new Map<string, number>();
    for (const a of accounts) net.set(a.currency, (net.get(a.currency) ?? 0) + a.balanceMinor);

    const income = new Map<string, number>();
    const expense = new Map<string, number>();
    for (const row of monthTotals(userId, month)) {
        const target = row.kind === 'income' ? income : expense;
        const amount = row.kind === 'income' ? row.totalMinor : -row.totalMinor;
        target.set(row.currency, (target.get(row.currency) ?? 0) + amount);
    }

    return {
        accounts,
        net: sortAmounts(net, mainCurrency),
        income: sortAmounts(income, mainCurrency),
        expense: sortAmounts(expense, mainCurrency),
    };
}
