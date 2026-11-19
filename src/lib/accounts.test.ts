import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountLabel, maskAccountNumber } from './accounts.ts';

test('maskAccountNumber keeps the last four letters or digits', () => {
    assert.equal(maskAccountNumber('1441 0012 3456 4821'), '•••• 4821');
    assert.equal(maskAccountNumber('0012345678901'), '•••• 8901');
    assert.equal(maskAccountNumber('024-555-0198'), '•••• 0198');
    assert.equal(maskAccountNumber('4821'), '4821');
    assert.equal(maskAccountNumber('  '), '');
    assert.equal(maskAccountNumber(null), '');
});

test('accountLabel adds the short number only when there is one', () => {
    assert.equal(accountLabel({ name: 'GCB Savings', currency: 'GHS', accountNumber: '1441001234564821' }), 'GCB Savings · •••• 4821 (GHS)');
    assert.equal(accountLabel({ name: 'Cash', currency: 'GHS', accountNumber: null }), 'Cash (GHS)');
    assert.equal(accountLabel({ name: 'Wallet', currency: 'USD' }), 'Wallet (USD)');
});
