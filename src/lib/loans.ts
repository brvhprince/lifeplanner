/** Pure loan arithmetic (integer minor units), shared by the server and tests. */

export type DebtState = {
    /** Amount borrowed/lent before charges. */
    principal: number;
    /** Finance charges included in the total to repay. */
    charges: number;
    /** Principal + charges paid back so far. */
    repaid: number;
    interestPaid: number;
    outstanding: number;
    /** True when the money borrowed/lent is recorded in an account. */
    disbursed: boolean;
};

export type LegTotals = { repaid: number; interestPaid: number; disbursed: number };

export function computeDebtState(
    debt: { amountMinor: number; principalMinor: number | null },
    legs: LegTotals | undefined
): DebtState {
    const principal = Math.min(debt.principalMinor ?? debt.amountMinor, debt.amountMinor);
    const repaid = legs?.repaid ?? 0;
    return {
        principal,
        charges: debt.amountMinor - principal,
        repaid,
        interestPaid: legs?.interestPaid ?? 0,
        outstanding: Math.max(0, debt.amountMinor - repaid),
        disbursed: (legs?.disbursed ?? 0) > 0,
    };
}

/**
 * Splits a repayment into principal and finance charge in proportion to what
 * is still outstanding, so the last payment always clears both exactly.
 */
export function splitRepayment(amount: number, state: Pick<DebtState, 'charges' | 'interestPaid' | 'outstanding'>) {
    const remainingCharges = Math.max(0, state.charges - state.interestPaid);
    if (!state.outstanding || !remainingCharges) return { principal: amount, interest: 0 };
    const interest = Math.min(remainingCharges, Math.round((amount * remainingCharges) / state.outstanding));
    return { principal: amount - interest, interest };
}

/** Loan fields that can't change once money is recorded for the loan. */
export const LOCKED_LOAN_FIELDS = ['direction', 'principalMinor', 'upfrontFeeMinor', 'currency'];
