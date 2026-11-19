import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeNumeric } from './numeric-input.ts';
import { toMinor } from './money.ts';

test('numeric keeps digits only', () => {
    assert.equal(sanitizeNumeric('1441 0012-3456', 'numeric'), '144100123456');
    assert.equal(sanitizeNumeric('abc', 'numeric'), '');
});

test('decimal keeps one point, commas and a leading minus', () => {
    assert.equal(sanitizeNumeric('GHS 1,250.50', 'decimal'), '1,250.50');
    assert.equal(sanitizeNumeric('12.3.4', 'decimal'), '12.34');
    assert.equal(sanitizeNumeric('-50', 'decimal'), '-50');
    assert.equal(sanitizeNumeric('5-0', 'decimal'), '50');
    assert.equal(sanitizeNumeric('1e5', 'decimal'), '15');
});

test('sanitized amounts still parse', () => {
    for (const raw of ['GHS 1,250.50', '-12.5', '373.92']) {
        assert.notEqual(toMinor(sanitizeNumeric(raw, 'decimal'), 'GHS'), null);
    }
});
