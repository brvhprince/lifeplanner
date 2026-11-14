import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isHttpUrl, isPhone, normalizeQuery, SEARCH_MAX_LENGTH } from './validate.ts';

test('normalizeQuery trims, caps length, and never ends in a space', () => {
    assert.equal(normalizeQuery('  rent  '), 'rent');
    assert.equal(normalizeQuery('a'.repeat(150)).length, SEARCH_MAX_LENGTH);
    // Cut lands right after a space: "a"×99 + " b" must not keep the space.
    const cut = normalizeQuery(`${'a'.repeat(99)} b`);
    assert.equal(cut, 'a'.repeat(99));
    assert.equal(normalizeQuery(cut), cut, 'normalising twice changes nothing');
});

test('isPhone requires digits', () => {
    assert.equal(isPhone('+233 24 000 0000'), true);
    assert.equal(isPhone('(030) 222-1234'), true);
    assert.equal(isPhone('-----'), false);
    assert.equal(isPhone('(12)'), false);
});

test('isHttpUrl requires an http(s) URL with a host', () => {
    assert.equal(isHttpUrl('https://penny.dev/x'), true);
    assert.equal(isHttpUrl('http://localhost:3000'), true);
    assert.equal(isHttpUrl('https://?'), false);
    assert.equal(isHttpUrl('javascript:alert(1)'), false);
    assert.equal(isHttpUrl('ftp://x.com'), false);
    assert.equal(isHttpUrl('not a link'), false);
});
