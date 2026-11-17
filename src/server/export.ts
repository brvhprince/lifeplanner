import 'server-only';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db, schema } from '@/server/db';
import { MODULES, getModule, statusOf } from '@/lib/modules/definitions';
import { listRecords, tableFor } from '@/server/modules/registry';
import { toCsv } from '@/lib/csv';
import { fromMinor } from '@/lib/money';
import type { FieldDef } from '@/lib/modules/types';

const { accounts, categories, transactions, timelineEntries, goalContributions, scheduleItems, files, attachments } = schema;

function transactionsCsv(userId: string) {
    const counter = alias(transactions, 'counter');
    const counterAccount = alias(accounts, 'counter_account');
    const rows = db
        .select({
            date: transactions.occurredOn,
            account: accounts.name,
            currency: accounts.currency,
            kind: transactions.kind,
            category: categories.name,
            title: transactions.title,
            amountMinor: transactions.amountMinor,
            status: transactions.status,
            note: transactions.note,
            otherAccount: counterAccount.name,
            id: transactions.id,
        })
        .from(transactions)
        .innerJoin(accounts, eq(accounts.id, transactions.accountId))
        .leftJoin(categories, eq(categories.id, transactions.categoryId))
        // The other leg of a transfer, to name the account money moved to/from.
        .leftJoin(counter, and(eq(counter.transferId, transactions.transferId), ne(counter.id, transactions.id)))
        .leftJoin(counterAccount, eq(counterAccount.id, counter.accountId))
        .where(eq(transactions.userId, userId))
        .orderBy(asc(transactions.occurredOn), asc(transactions.createdAt))
        .all();

    return toCsv(
        ['date', 'account', 'currency', 'type', 'category', 'description', 'amount', 'status', 'note', 'transfer_with', 'id'],
        rows.map((r) => [
            r.date,
            r.account,
            r.currency,
            r.kind,
            r.category,
            r.title,
            fromMinor(r.amountMinor, r.currency),
            r.status,
            r.note,
            r.otherAccount,
            r.id,
        ])
    );
}

function accountsCsv(userId: string) {
    const rows = db.select().from(accounts).where(eq(accounts.userId, userId)).orderBy(asc(accounts.name)).all();
    return toCsv(
        ['name', 'type', 'currency', 'opening_balance', 'primary', 'archived', 'description', 'id'],
        rows.map((a) => [a.name, a.type, a.currency, fromMinor(a.openingBalanceMinor, a.currency), a.isPrimary, Boolean(a.archivedAt), a.description, a.id])
    );
}

function rawValue(field: FieldDef, record: Record<string, unknown>, names: Map<string, string>) {
    const value = record[field.name];
    if (value === null || value === undefined) return '';
    if (field.type === 'money') return fromMinor(Number(value), String(record[field.currencyField ?? 'currency'] ?? 'USD'));
    if (field.type === 'account' || field.type === 'category' || field.type === 'employer') return names.get(String(value)) ?? '';
    return value as string | number | boolean;
}

function moduleCsv(key: string, userId: string) {
    const def = getModule(key)!;
    const records = listRecords(def, userId);
    const names = new Map<string, string>([
        ...db.select({ id: accounts.id, name: accounts.name }).from(accounts).where(eq(accounts.userId, userId)).all().map((a) => [a.id, a.name] as const),
        ...db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.userId, userId)).all().map((c) => [c.id, c.name] as const),
        ...db.select({ id: schema.employers.id, name: schema.employers.name }).from(schema.employers).where(eq(schema.employers.userId, userId)).all().map((e) => [e.id, e.name] as const),
    ]);
    const stored = def.fields.filter((f) => !f.virtual);
    const header = [...stored.map((f) => f.name.replace(/Minor$/, '')), ...(def.statuses ? ['status'] : []), 'created', 'updated', 'id'];
    return toCsv(
        header,
        records.map((r) => [
            ...stored.map((f) => rawValue(f, r, names)),
            ...(def.statuses ? [statusOf(def, r.status)?.label ?? String(r.status)] : []),
            r.createdAt.toISOString(),
            r.updatedAt.toISOString(),
            r.id,
        ])
    );
}

function timelineCsv(userId: string) {
    const rows = db.select().from(timelineEntries).where(eq(timelineEntries.userId, userId)).orderBy(asc(timelineEntries.occurredAt)).all();
    const titles = new Map<string, string>();
    for (const def of MODULES) for (const r of listRecords(def, userId)) titles.set(r.id, String(r[def.titleField]));
    return toCsv(
        ['date', 'section', 'record', 'entry', 'details'],
        rows.map((e) => [e.occurredAt.toISOString().slice(0, 10), getModule(e.entityType)?.title ?? e.entityType, titles.get(e.entityId), e.title, e.body])
    );
}

/** Everything the user owns as one JSON document (no password hash or secrets). */
function everythingJson(userId: string) {
    const u = schema.users;
    const profile = db
        .select({ id: u.id, firstName: u.firstName, otherNames: u.otherNames, email: u.email, currency: u.currency, createdAt: u.createdAt })
        .from(u)
        .where(eq(u.id, userId))
        .get();
    const data: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        format: 'lifeplanner-export/1',
        note: 'Money amounts are integer minor units (e.g. cents) in the stated currency.',
        user: profile,
        profile: db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId)).get() ?? null,
        accounts: db.select().from(accounts).where(eq(accounts.userId, userId)).all(),
        categories: db.select().from(categories).where(eq(categories.userId, userId)).all(),
        transactions: db.select().from(transactions).where(eq(transactions.userId, userId)).all(),
        transfers: db.select().from(schema.transfers).where(eq(schema.transfers.userId, userId)).all(),
        goalContributions: db.select().from(goalContributions).where(eq(goalContributions.userId, userId)).all(),
        scheduleItems: db.select().from(scheduleItems).where(eq(scheduleItems.userId, userId)).all(),
        timeline: db.select().from(timelineEntries).where(eq(timelineEntries.userId, userId)).all(),
        employerContacts: db.select().from(schema.employerContacts).where(eq(schema.employerContacts.userId, userId)).all(),
    };
    for (const def of MODULES) {
        const { table, columns } = tableFor(def);
        data[def.key] = db.select().from(table).where(eq(columns.userId, userId)).all();
    }
    const fileRows = db
        .select({ id: files.id, name: files.name, mimeType: files.mimeType, size: files.size, createdAt: files.createdAt })
        .from(files)
        .where(eq(files.userId, userId))
        .all();
    data.files = fileRows;
    data.attachments = fileRows.length
        ? db.select().from(attachments).where(inArray(attachments.fileId, fileRows.map((f) => f.id))).all()
        : [];
    return JSON.stringify(data, null, 2);
}

export type ExportFile = { body: string | ReadableStream; type: string; cleanup?: () => void };

export const EXPORTS = [
    { name: 'transactions.csv', label: 'Transactions' },
    { name: 'accounts.csv', label: 'Accounts' },
    ...MODULES.map((m) => ({ name: `${m.key}.csv`, label: m.title })),
    { name: 'timeline.csv', label: 'All progress logs' },
];

export async function buildExport(name: string, userId: string): Promise<ExportFile | null> {
    const csv = 'text/csv; charset=utf-8';
    if (name === 'transactions.csv') return { body: transactionsCsv(userId), type: csv };
    if (name === 'accounts.csv') return { body: accountsCsv(userId), type: csv };
    if (name === 'timeline.csv') return { body: timelineCsv(userId), type: csv };
    if (name === 'lifeplanner.json') return { body: everythingJson(userId), type: 'application/json; charset=utf-8' };
    if (name === 'lifeplanner.db') {
        // A consistent snapshot via SQLite's online backup, then streamed and removed.
        const tmp = path.join(os.tmpdir(), `lifeplanner-${crypto.randomUUID()}.db`);
        await db.$client.backup(tmp);
        const { Readable } = await import('node:stream');
        const stream = fs.createReadStream(tmp);
        stream.on('close', () => fs.rm(tmp, { force: true }, () => {}));
        return { body: Readable.toWeb(stream) as ReadableStream, type: 'application/vnd.sqlite3' };
    }
    const match = /^([a-z]+)\.csv$/.exec(name);
    if (match && getModule(match[1])) return { body: moduleCsv(match[1], userId), type: csv };
    return null;
}
