import 'server-only';
import { and, desc, eq, or, sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { db, schema } from '@/server/db';
import { MODULES, getModule, statusOf } from '@/lib/modules/definitions';
import { tableFor, type RecordRow } from '@/server/modules/registry';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/dates';
import { normalizeQuery } from '@/lib/validate';
import { findMatches, fold } from '@/lib/fold';

export type SearchHit = { href: string; title: string; detail?: string; snippet?: string };
export type SearchGroup = { label: string; hits: SearchHit[] };

const PER_GROUP = 10;

/**
 * Case-insensitive substring match using lp_fold() (registered on the
 * connection) and instr(), with the same folding as result highlighting.
 * Characters like % and _ are matched literally.
 */
function matches(query: string, ...columns: SQLiteColumn[]): SQL {
    const needle = fold(query);
    return or(...columns.map((c) => sql`instr(lp_fold(${c}), ${needle}) > 0`))!;
}

/** A short excerpt of `text` around the first match. */
function snippet(text: unknown, query: string) {
    if (typeof text !== 'string' || !text) return undefined;
    const match = findMatches(text, query)[0];
    if (!match) return undefined;
    const start = Math.max(0, match[0] - 40);
    const end = Math.min(text.length, match[1] + 80);
    return `${start > 0 ? '…' : ''}${text.slice(start, end).replace(/\s+/g, ' ')}${end < text.length ? '…' : ''}`;
}

export function search(userId: string, rawQuery: string): SearchGroup[] {
    const q = normalizeQuery(rawQuery);
    if (q.length < 2) return [];
    const groups: SearchGroup[] = [];
    const add = (label: string, hits: SearchHit[]) => hits.length && groups.push({ label, hits });

    // Transactions
    const t = schema.transactions;
    const a = schema.accounts;
    add(
        'Transactions',
        db
            .select({ id: t.id, title: t.title, note: t.note, amountMinor: t.amountMinor, occurredOn: t.occurredOn, account: a.name, currency: a.currency })
            .from(t)
            .innerJoin(a, eq(a.id, t.accountId))
            .where(and(eq(t.userId, userId), matches(q, t.title, t.note)))
            .orderBy(desc(t.occurredOn))
            .limit(PER_GROUP)
            .all()
            .map((r) => ({
                href: `/transactions/${r.id}`,
                title: r.title,
                detail: `${formatDate(r.occurredOn)} · ${r.account} · ${formatMoney(r.amountMinor, r.currency, { signed: true })}`,
                snippet: snippet(r.note, q),
            }))
    );

    add(
        'Accounts',
        db
            .select()
            .from(a)
            .where(and(eq(a.userId, userId), matches(q, a.name, a.description)))
            .limit(PER_GROUP)
            .all()
            .map((r) => ({ href: `/accounts/${r.id}`, title: r.name, detail: `${r.type} · ${r.currency}`, snippet: snippet(r.description, q) }))
    );

    const c = schema.categories;
    add(
        'Categories',
        db
            .select()
            .from(c)
            .where(and(eq(c.userId, userId), matches(q, c.name)))
            .limit(PER_GROUP)
            .all()
            .map((r) => ({ href: `/transactions?category=${r.id}`, title: r.name, detail: r.kind === 'income' ? 'Income category' : 'Expense category' }))
    );

    // Every module, over its title and free-text fields.
    for (const def of MODULES) {
        const { table, columns } = tableFor(def);
        const textFields = [def.titleField, ...def.fields.filter((f) => ['text', 'textarea', 'url', 'email'].includes(f.type)).map((f) => f.name)];
        const searchable = [...new Set(textFields)].map((name) => columns[name]).filter(Boolean);
        const rows = db
            .select()
            .from(table)
            .where(and(eq(columns.userId, userId), matches(q, ...searchable)))
            .orderBy(desc(columns.updatedAt))
            .limit(PER_GROUP)
            .all() as RecordRow[];
        add(
            def.title,
            rows.map((r) => {
                const status = statusOf(def, r.status);
                const longText = textFields.filter((n) => n !== def.titleField).map((n) => snippet(r[n], q)).find(Boolean);
                return { href: `/${def.key}/${r.id}`, title: String(r[def.titleField]), detail: status?.label, snippet: longText };
            })
        );
    }

    // Progress logs, linked back to their record.
    const tl = schema.timelineEntries;
    const entries = db
        .select()
        .from(tl)
        .where(and(eq(tl.userId, userId), matches(q, tl.title, tl.body)))
        .orderBy(desc(tl.occurredAt))
        .limit(PER_GROUP)
        .all();
    add(
        'Log entries',
        entries.map((e) => ({
            href: `/${e.entityType}/${e.entityId}`,
            title: e.title,
            detail: `${getModule(e.entityType)?.title ?? e.entityType} · ${e.occurredAt.toLocaleDateString(undefined, { dateStyle: 'medium' })}`,
            snippet: snippet(e.body, q),
        }))
    );

    // Files, linked to what they're attached to.
    const f = schema.files;
    const at = schema.attachments;
    add(
        'Files',
        db
            .select({ id: f.id, name: f.name, entityType: at.entityType, entityId: at.entityId })
            .from(f)
            .innerJoin(at, eq(at.fileId, f.id))
            .where(and(eq(f.userId, userId), matches(q, f.name)))
            .limit(PER_GROUP)
            .all()
            .map((r) => ({
                href: r.entityType === 'transaction' ? `/transactions/${r.entityId}` : `/${r.entityType}/${r.entityId}`,
                title: r.name,
                detail: r.entityType === 'transaction' ? 'Attached to a transaction' : `Attached in ${getModule(r.entityType)?.title ?? r.entityType}`,
            }))
    );

    const ec = schema.employerContacts;
    const em = schema.employers;
    add(
        'Work contacts',
        db
            .select({ employerId: em.id, employer: em.name, label: ec.label, value: ec.value })
            .from(ec)
            .innerJoin(em, eq(em.id, ec.employerId))
            .where(and(eq(ec.userId, userId), matches(q, ec.label, ec.value)))
            .limit(PER_GROUP)
            .all()
            .map((r) => ({ href: `/work/${r.employerId}`, title: r.value, detail: `${r.label} · ${r.employer}` }))
    );

    const si = schema.scheduleItems;
    const sc = schema.schedules;
    add(
        'Routine steps',
        db
            .select({ scheduleId: sc.id, routine: sc.title, title: si.title })
            .from(si)
            .innerJoin(sc, eq(sc.id, si.scheduleId))
            .where(and(eq(si.userId, userId), matches(q, si.title)))
            .limit(PER_GROUP)
            .all()
            .map((r) => ({ href: `/schedules/${r.scheduleId}`, title: r.title, detail: r.routine }))
    );

    return groups;
}
