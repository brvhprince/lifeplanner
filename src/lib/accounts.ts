/** The last four letters/digits of an account number, e.g. "•••• 4821". */
export function maskAccountNumber(accountNumber: string | null | undefined) {
    const chars = (accountNumber ?? '').replace(/[^0-9a-z]/gi, '');
    if (!chars) return '';
    return chars.length <= 4 ? chars : `•••• ${chars.slice(-4)}`;
}

/** How an account appears in pickers: name, short number and currency. */
export function accountLabel(account: { name: string; currency: string; accountNumber?: string | null }) {
    const masked = maskAccountNumber(account.accountNumber);
    return `${account.name}${masked ? ` · ${masked}` : ''} (${account.currency})`;
}
