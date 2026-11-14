import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMatches, fold } from './fold.ts';

const marked = (text: string, query: string) => findMatches(text, query).map(([s, e]) => text.slice(s, e));

test('folds case for accented Latin letters', () => {
    assert.equal(fold('Élodie'), fold('élodie'));
    assert.deepEqual(marked('Élodie Asante', 'ÉLODIE'), ['Élodie']);
});

test('Greek final sigma matches regardless of position', () => {
    assert.ok(fold('ΟΣΑ').includes(fold('ΟΣ')));
    assert.ok(fold('ΟΣΑ').includes(fold('ος')));
    assert.deepEqual(marked('ΟΣΑ', 'ΟΣ'), ['ΟΣ']);
});

test('dotted capital I matches i + combining dot, and highlights the original', () => {
    assert.ok(fold('İpek').includes(fold('i̇p')));
    assert.deepEqual(marked('İpek', 'i̇p'), ['İp']);
});

test('characters that expand when folded map back to the original', () => {
    assert.deepEqual(marked('Straße 5', 'STRASSE'), ['Straße']);
});

test('% and _ are ordinary characters', () => {
    assert.deepEqual(marked('50% off', '50%'), ['50%']);
    assert.deepEqual(marked('snake_case', '_'), ['_']);
    assert.deepEqual(marked('no wildcards', '%'), []);
});

test('marks every non-overlapping occurrence', () => {
    assert.deepEqual(findMatches('Rent, rent, RENT', 'rent'), [
        [0, 4],
        [6, 10],
        [12, 16],
    ]);
    assert.deepEqual(findMatches('aaaa', 'aa'), [
        [0, 2],
        [2, 4],
    ]);
});

test('empty query matches nothing', () => {
    assert.deepEqual(findMatches('anything', ''), []);
});
