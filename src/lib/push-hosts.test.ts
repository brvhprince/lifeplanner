import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedPushEndpoint } from './push-hosts.ts';

test('accepts the browser push services', () => {
    for (const endpoint of [
        'https://fcm.googleapis.com/fcm/send/abc123',
        'https://web.push.apple.com/QGhyZWYx',
        'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
        'https://wns2-par02p.notify.windows.com/w/?token=x',
    ]) {
        assert.equal(isAllowedPushEndpoint(endpoint), true, endpoint);
    }
});

test('rejects other hosts, ports, schemes and look-alikes', () => {
    for (const endpoint of [
        'https://192.168.1.10/admin',
        'https://router.local/push',
        'https://fcm.googleapis.com:8443/fcm/send/x',
        'http://fcm.googleapis.com/fcm/send/x',
        'https://fcm.googleapis.com.evil.example/x',
        'https://evilpush.apple.com.example/x',
        'https://user:pass@fcm.googleapis.com/x',
        'not a url',
    ]) {
        assert.equal(isAllowedPushEndpoint(endpoint), false, endpoint);
    }
});

test('extra hosts can be allowed explicitly', () => {
    assert.equal(isAllowedPushEndpoint('https://push.example.org/x', ['push.example.org']), true);
});
