import 'server-only';
import { listAccounts, monthTotals } from '@/server/finance/queries';
import { listDebtStates } from '@/server/finance/debts';

type Amount = { currency: string; minor: number };

/** Orders per-currency amounts with the user's main currency first, dropping zeros. */
function sortAmounts(amounts: Map<string, number>, mainCurrency: string): Amount[] {
    return [...amounts.entries()]
        .filter(([, minor]) => minor !== 0)
        .map(([currency, minor]) => ({ currency, minor }))
        .sort((a, b) => (a.currency === mainCurrency ? -1 : b.currency === mainCurrency ? 1 : a.currency.localeCompare(b.currency)));
}

const add = (map: Map<string, number>, currency: string, minor: number) => map.set(currency, (map.get(currency) ?? 0) + minor);

export function financeSummary(userId: string, mainCurrency: string, month: string) {
    const accounts = listAccounts(userId);
    const debts = listDebtStates(userId, { activeOnly: true });

    const balance = new Map<string, number>();
    const overdraftUsed = new Map<string, number>();
    for (const a of accounts) {
        add(balance, a.currency, a.balanceMinor);
        if (a.balanceMinor < 0) add(overdraftUsed, a.currency, -a.balanceMinor);
    }

    const loansOwed = new Map<string, number>();
    const owedToYou = new Map<string, number>();
    for (const { debt, state } of debts) {
        add(debt.direction === 'owed' ? loansOwed : owedToYou, debt.currency, state.outstanding);
    }

    // What you owe = loans outstanding + overdraft in use. The overdraft is
    // already negative in the balances, so the net position only subtracts loans.
    const owe = new Map(loansOwed);
    for (const [currency, minor] of overdraftUsed) add(owe, currency, minor);
    const position = new Map(balance);
    for (const [currency, minor] of loansOwed) add(position, currency, -minor);
    for (const [currency, minor] of owedToYou) add(position, currency, minor);

    const income = new Map<string, number>();
    const expense = new Map<string, number>();
    for (const row of monthTotals(userId, month)) {
        const target = row.kind === 'income' ? income : expense;
        add(target, row.currency, row.kind === 'income' ? row.totalMinor : -row.totalMinor);
    }

    const nextLoans = debts
        .filter(({ debt, state }) => debt.direction === 'owed' && state.outstanding > 0)
        .sort((a, b) => (a.debt.dueOn ?? '9999').localeCompare(b.debt.dueOn ?? '9999'));

    return {
        accounts,
        balance: sortAmounts(balance, mainCurrency),
        owe: sortAmounts(owe, mainCurrency),
        overdraftUsed: sortAmounts(overdraftUsed, mainCurrency),
        owedToYou: sortAmounts(owedToYou, mainCurrency),
        position: sortAmounts(position, mainCurrency),
        income: sortAmounts(income, mainCurrency),
        expense: sortAmounts(expense, mainCurrency),
        nextLoans,
    };
}
