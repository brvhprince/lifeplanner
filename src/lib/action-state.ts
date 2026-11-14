import type { ZodType } from 'zod';

/** Result returned by every form Server Action. */
export type ActionState = {
    ok?: boolean;
    message?: string;
    error?: string;
    fieldErrors?: Record<string, string>;
    /** Submitted values echoed back so fields keep their input after an error. */
    values?: Record<string, string>;
};

export type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const SENSITIVE = /password|code|secret/i;

export function formValues(formData: FormData) {
    const values: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string' && !key.startsWith('$') && !SENSITIVE.test(key)) values[key] = value;
    }
    return values;
}

/** Validates FormData with a zod schema, mapping issues to per-field errors. */
export function parseForm<T>(
    schema: ZodType<T>,
    formData: FormData
): { data: T; state?: undefined } | { data?: undefined; state: ActionState } {
    const raw = Object.fromEntries(
        [...formData.entries()].filter(([key, value]) => typeof value === 'string' && !key.startsWith('$'))
    );
    const result = schema.safeParse(raw);
    if (result.success) return { data: result.data };

    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? '_');
        fieldErrors[key] ??= issue.message;
    }
    return {
        state: { error: fieldErrors._ ?? 'Please fix the highlighted fields', fieldErrors, values: formValues(formData) },
    };
}
