import 'server-only';
import { and, eq } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { db, schema } from '@/server/db';
import { formValues, type ActionState } from '@/lib/action-state';
import { isCurrency, toMinor } from '@/lib/money';
import { isIsoDate } from '@/lib/dates';
import type { FieldDef, ModuleDef } from '@/lib/modules/types';
import { isHttpUrl } from '@/lib/validate';

const DEFAULT_MAX = { text: 200, textarea: 5000, url: 2000, email: 254 } as const;

function owns(table: typeof schema.accounts | typeof schema.categories | typeof schema.employers, userId: string, id: string) {
    return Boolean(db.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.userId, userId))).get());
}

/**
 * Turns submitted form data into column values for a module table, using the
 * module's field definitions. Empty optional fields become null (or are left
 * out for NOT NULL columns so the database default applies).
 */
export function parseRecord(
    def: ModuleDef,
    columns: Record<string, SQLiteColumn>,
    formData: FormData,
    ctx: { userId: string; defaultCurrency: string }
): { values: Record<string, unknown>; state?: undefined } | { values?: undefined; state: ActionState } {
    const values: Record<string, unknown> = {};
    const errors: Record<string, string> = {};
    const raw = (name: string) => String(formData.get(name) ?? '').trim();

    const currencyOf = (field: FieldDef) => {
        const code = field.currencyField ? raw(field.currencyField).toUpperCase() : '';
        return code || ctx.defaultCurrency;
    };

    const empty = (field: FieldDef) => {
        if (field.required) errors[field.name] = `${field.label} is required`;
        // NOT NULL money columns (e.g. fees) mean "none" when emptied; other
        // NOT NULL columns keep their database default.
        else values[field.name] = columns[field.name]?.notNull ? (field.type === 'money' ? 0 : undefined) : null;
    };

    for (const field of def.fields) {
        if (field.virtual) continue;
        const value = raw(field.name);

        if (field.type === 'checkbox') {
            values[field.name] = formData.get(field.name) === 'on';
            continue;
        }
        if (!value) {
            empty(field);
            continue;
        }

        switch (field.type) {
            case 'text':
            case 'textarea':
            case 'url':
            case 'email': {
                const max = field.max ?? DEFAULT_MAX[field.type];
                if (value.length > max) errors[field.name] = `Keep it under ${max} characters`;
                else if (field.type === 'url' && !isHttpUrl(value)) errors[field.name] = 'Enter a full link starting with https://';
                else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[field.name] = 'Enter a valid email';
                else values[field.name] = value;
                break;
            }
            case 'date':
                if (isIsoDate(value)) values[field.name] = value;
                else errors[field.name] = 'Enter a valid date';
                break;
            case 'datetime':
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) && isIsoDate(value.slice(0, 10))) values[field.name] = value;
                else errors[field.name] = 'Enter a valid date and time';
                break;
            case 'select':
                if (field.options?.some((o) => o.value === value)) values[field.name] = value;
                else errors[field.name] = `Choose a ${field.label.toLowerCase()}`;
                break;
            case 'currency':
                if (isCurrency(value.toUpperCase())) values[field.name] = value.toUpperCase();
                else errors[field.name] = 'Choose a valid currency';
                break;
            case 'money': {
                const minor = toMinor(value, currencyOf(field));
                if (minor === null || minor < 0) errors[field.name] = 'Enter a valid amount';
                else values[field.name] = minor;
                break;
            }
            case 'account':
                if (owns(schema.accounts, ctx.userId, value)) values[field.name] = value;
                else errors[field.name] = 'Choose an account';
                break;
            case 'category':
                if (owns(schema.categories, ctx.userId, value)) values[field.name] = value;
                else errors[field.name] = 'Choose a category';
                break;
            case 'employer':
                if (owns(schema.employers, ctx.userId, value)) values[field.name] = value;
                else errors[field.name] = 'Choose an employer';
                break;
        }
    }

    // An amount needs a currency even when the currency field is optional.
    for (const field of def.fields) {
        if (field.type === 'money' && typeof values[field.name] === 'number' && field.currencyField && !values[field.currencyField]) {
            values[field.currencyField] = currencyOf(field);
        }
    }

    if (Object.keys(errors).length) {
        return { state: { error: 'Please fix the highlighted fields', fieldErrors: errors, values: formValues(formData) } };
    }
    return { values };
}
