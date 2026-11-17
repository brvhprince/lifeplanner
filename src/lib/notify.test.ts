import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notificationKind } from './notify.ts';

const now = { date: '2026-11-17', time: '09:30' };

test('due today, overdue, and upcoming bills', () => {
    assert.equal(notificationKind({ date: '2026-11-17', detail: 'Bill due' }, now), 'due');
    assert.equal(notificationKind({ date: '2026-11-10', detail: 'Pay Fido' }, now), 'due');
    assert.equal(notificationKind({ date: '2026-11-20', detail: 'Pay Fido' }, now), 'ahead');
});

test('timed reminders wait for their time and get no heads-up', () => {
    assert.equal(notificationKind({ date: '2026-11-17', time: '18:00', detail: 'Reminder' }, now), null);
    assert.equal(notificationKind({ date: '2026-11-17', time: '09:00', detail: 'Reminder' }, now), 'due');
    assert.equal(notificationKind({ date: '2026-11-17', time: '00:00', detail: 'Reminder' }, now), 'due');
    assert.equal(notificationKind({ date: '2026-11-19', time: '09:00', detail: 'Reminder' }, now), null);
});
