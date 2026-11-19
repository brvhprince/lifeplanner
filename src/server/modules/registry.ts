import 'server-only';
import { and, asc, desc, eq, getTableColumns, inArray, sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { db, schema } from '@/server/db';
import type { ModuleDef, ModuleKey } from '@/lib/modules/types';
import { listPeople } from '@/server/finance/queries';
import { accountLabel } from '@/lib/accounts';

const TABLES = {
    subscriptions: schema.subscriptions,
    goals: schema.goals,
    savings: schema.savingsPlans,
    debts: schema.debts,
    investments: schema.investments,
    wishlist: schema.wishlistItems,
    plans: schema.futurePlans,
    projects: schema.projects,
    learning: schema.learnings,
    career: schema.careers,
    branding: schema.brandingGoals,
    notes: schema.notes,
    memories: schema.memories,
    people: schema.relationships,
    responsibilities: schema.responsibilities,
    work: schema.employers,
    reminders: schema.reminders,
    schedules: schema.schedules,
} satisfies Record<ModuleKey, SQLiteTable>;

/** A row from any module table, accessed by column key. */
export type RecordRow = Record<string, unknown> & { id: string; createdAt: Date; updatedAt: Date };

export function tableFor(def: ModuleDef) {
    const table = TABLES[def.key] as SQLiteTable;
    const columns = getTableColumns(table) as Record<string, SQLiteColumn>;
    return { table, columns };
}

function ownerFilter(def: ModuleDef, userId: string, extra?: SQL) {
    const { columns } = tableFor(def);
    return and(eq(columns.userId, userId), extra);
}

export function listRecords(def: ModuleDef, userId: string, { status }: { status?: string } = {}) {
    const { table, columns } = tableFor(def);
    const sortCol = columns[def.sort?.field ?? 'createdAt'] ?? columns.createdAt;
    const order = [];
    if (columns.pinned) order.push(desc(columns.pinned));
    // Nulls last for ascending date sorts so undated items don't crowd the top.
    if (def.sort?.dir === 'asc') order.push(sql`${sortCol} is null`, asc(sortCol));
    else order.push(desc(sortCol));
    order.push(desc(columns.createdAt));

    return db
        .select()
        .from(table)
        .where(ownerFilter(def, userId, status && columns.status ? eq(columns.status, status) : undefined))
        .orderBy(...order)
        .all() as RecordRow[];
}

export function getRecord(def: ModuleDef, userId: string, id: string) {
    const { table, columns } = tableFor(def);
    return (db.select().from(table).where(ownerFilter(def, userId, eq(columns.id, id))).get() as RecordRow | undefined) ?? null;
}

export function countByStatus(def: ModuleDef, userId: string) {
    const { table, columns } = tableFor(def);
    if (!columns.status) return {};
    const rows = db
        .select({ status: columns.status, total: sql<number>`count(*)` })
        .from(table)
        .where(eq(columns.userId, userId))
        .groupBy(columns.status)
        .all() as { status: string; total: number }[];
    return Object.fromEntries(rows.map((r) => [r.status, r.total]));
}

/** Sum of contributions per goal. */
export function goalProgress(userId: string, goalIds: string[]) {
    if (!goalIds.length) return new Map<string, number>();
    const rows = db
        .select({ goalId: schema.goalContributions.goalId, total: sql<number>`sum(${schema.goalContributions.amountMinor})` })
        .from(schema.goalContributions)
        .where(and(eq(schema.goalContributions.userId, userId), inArray(schema.goalContributions.goalId, goalIds)))
        .groupBy(schema.goalContributions.goalId)
        .all();
    return new Map(rows.map((r) => [r.goalId, r.total]));
}

export function listTimeline(userId: string, entityType: string, entityId: string) {
    const t = schema.timelineEntries;
    return db
        .select()
        .from(t)
        .where(and(eq(t.userId, userId), eq(t.entityType, entityType), eq(t.entityId, entityId)))
        .orderBy(desc(t.occurredAt), desc(t.createdAt))
        .all();
}

/** Names for the account/category pickers and for displaying stored ids. */
export function formOptions(userId: string) {
    const accounts = db
        .select({
            id: schema.accounts.id,
            name: schema.accounts.name,
            currency: schema.accounts.currency,
            accountNumber: schema.accounts.accountNumber,
            archivedAt: schema.accounts.archivedAt,
        })
        .from(schema.accounts)
        .where(eq(schema.accounts.userId, userId))
        .orderBy(asc(schema.accounts.name))
        .all();
    const categories = db
        .select({ id: schema.categories.id, name: schema.categories.name, kind: schema.categories.kind, archivedAt: schema.categories.archivedAt })
        .from(schema.categories)
        .where(eq(schema.categories.userId, userId))
        .orderBy(asc(schema.categories.kind), asc(schema.categories.name))
        .all();
    const employers = db
        .select({ id: schema.employers.id, name: schema.employers.name })
        .from(schema.employers)
        .where(eq(schema.employers.userId, userId))
        .orderBy(asc(schema.employers.name))
        .all();
    const people = listPeople(userId);
    return {
        employers: employers.map((e) => ({ value: e.id, label: e.name })),
        people: people.map((p) => ({ value: p.id, label: p.name })),
        accounts: accounts.filter((a) => !a.archivedAt).map((a) => ({ value: a.id, label: accountLabel(a) })),
        categories: categories
            .filter((c) => !c.archivedAt)
            .map((c) => ({ value: c.id, label: `${c.name} · ${c.kind === 'income' ? 'in' : 'out'}` })),
        names: new Map<string, string>([
            ...accounts.map((a) => [a.id, a.name] as const),
            ...categories.map((c) => [c.id, c.name] as const),
            ...employers.map((e) => [e.id, e.name] as const),
            ...people.map((p) => [p.id, p.name] as const),
        ]),
    };
}

export type FormOptions = ReturnType<typeof formOptions>;
