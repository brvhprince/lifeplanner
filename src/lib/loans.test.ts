import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDebtState, splitRepayment } from './loans.ts';

// The Fido example: borrowed 380.00, 6.08 fee upfront, 458.74 to repay.
const fido = { amountMinor: 45874, principalMinor: 38000 };

test('state of a new loan', () => {
    const s = computeDebtState(fido, undefined);
    assert.equal(s.principal, 38000);
    assert.equal(s.charges, 7874);
    assert.equal(s.outstanding, 45874);
    assert.equal(s.disbursed, false);
});

test('repaying in full clears principal and charges exactly', () => {
    const s = computeDebtState(fido, undefined);
    assert.deepEqual(splitRepayment(45874, s), { principal: 38000, interest: 7874 });
});

test('partial repayments split proportionally and always add up', () => {
    let state = computeDebtState(fido, undefined);
    let principalPaid = 0;
    let interestPaid = 0;
    for (const amount of [10000, 12345, 7, 23522]) {
        const split = splitRepayment(amount, state);
        assert.equal(split.principal + split.interest, amount);
        principalPaid += split.principal;
        interestPaid += split.interest;
        state = computeDebtState(fido, { repaid: principalPaid + interestPaid, interestPaid, disbursed: 1, repaymentLegs: 1 });
    }
    assert.equal(state.outstanding, 0);
    assert.equal(interestPaid, 7874, 'all charges paid, no more, no less');
    assert.equal(principalPaid, 38000);
});

test('loans without interest are all principal', () => {
    const s = computeDebtState({ amountMinor: 30000, principalMinor: null }, undefined);
    assert.equal(s.charges, 0);
    assert.deepEqual(splitRepayment(15000, s), { principal: 15000, interest: 0 });
});

test('principal above the total is capped (no negative charges)', () => {
    const s = computeDebtState({ amountMinor: 1000, principalMinor: 1200 }, undefined);
    assert.equal(s.principal, 1000);
    assert.equal(s.charges, 0);
});

test('outstanding never goes below zero', () => {
    const s = computeDebtState(fido, { repaid: 50000, interestPaid: 7874, disbursed: 1, repaymentLegs: 2 });
    assert.equal(s.outstanding, 0);
});
