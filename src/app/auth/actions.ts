'use server';

import { redirect } from 'next/navigation';
import { count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/server/db';
import { hashPassword, passwordProblem, verifyPassword } from '@/server/auth/password';
import { completeTotp, createSession, destroySession, getSession, requestInfo } from '@/server/auth/session';
import { clearFailures, isRateLimited, recordFailure } from '@/server/auth/rate-limit';
import { verifyTotp } from '@/server/auth/totp';
import { hasOwner } from '@/server/auth/owner';
import { logActivity } from '@/server/activity';
import { formValues, parseForm, type ActionState } from '@/lib/action-state';
import { isCurrency } from '@/lib/money';
import routes from '@/config/routes';

const INVALID_CREDENTIALS = 'Invalid email or password';

const STARTER_CATEGORIES = [
    { kind: 'income', name: 'Salary', color: '#66CB9F' },
    { kind: 'income', name: 'Side income', color: '#68DBF2' },
    { kind: 'expense', name: 'Housing', color: '#4C6FFF' },
    { kind: 'expense', name: 'Groceries', color: '#F7936F' },
    { kind: 'expense', name: 'Transport', color: '#7952B3' },
    { kind: 'expense', name: 'Utilities', color: '#4CAFD0' },
    { kind: 'expense', name: 'Eating out', color: '#FF92AE' },
    { kind: 'expense', name: 'Health', color: '#F16063' },
    { kind: 'expense', name: 'Fun', color: '#FAB592' },
] as const;

const setupSchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    otherNames: z.string().trim().max(200).default(''),
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
    currency: z.string().trim().toUpperCase().refine(isCurrency, 'Choose a valid currency'),
    password: z.string(),
    confirmPassword: z.string(),
});

/** Creates the owner account. Only works while no user exists. */
export async function setupOwner(_prev: ActionState, formData: FormData): Promise<ActionState> {
    if (hasOwner()) redirect(routes.signIn);

    const parsed = parseForm(setupSchema, formData);
    if (!parsed.data) return parsed.state;
    const { password, confirmPassword, ...profile } = parsed.data;

    const problem = passwordProblem(password);
    if (problem) return { error: problem, fieldErrors: { password: problem }, values: formValues(formData) };
    if (password !== confirmPassword) {
        return {
            error: 'Passwords do not match',
            fieldErrors: { confirmPassword: 'Passwords do not match' },
            values: formValues(formData),
        };
    }

    const passwordHash = await hashPassword(password);
    const user = db.transaction((tx) => {
        // Re-check inside the transaction so two concurrent submissions can't both win.
        const [{ total }] = tx.select({ total: count() }).from(schema.users).all();
        if (total > 0) return null;
        const created = tx.insert(schema.users).values({ ...profile, passwordHash }).returning().get();
        tx.insert(schema.profiles).values({ userId: created.id }).run();
        tx.insert(schema.categories)
            .values(STARTER_CATEGORIES.map((c) => ({ ...c, userId: created.id })))
            .run();
        return created;
    });
    if (!user) redirect(routes.signIn);

    logActivity(user.id, 'auth.setup', 'Owner account created');
    await createSession(user.id);
    redirect(routes.home);
}

const signInSchema = z.object({
    email: z.string().trim().toLowerCase().min(1, 'Email is required'),
    password: z.string().min(1, 'Password is required'),
});

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const parsed = parseForm(signInSchema, formData);
    if (!parsed.data) return parsed.state;
    const { email, password } = parsed.data;

    const { ip } = await requestInfo();
    const limiterKey = `signin:${ip ?? 'unknown'}`;
    if (isRateLimited(limiterKey)) {
        return { error: 'Too many failed attempts. Try again in 15 minutes.', values: { email } };
    }

    const user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    const valid = await verifyPassword(user?.passwordHash, password);

    if (!user || !valid) {
        recordFailure(limiterKey);
        if (user) logActivity(user.id, 'auth.signin_failed', 'Failed sign-in attempt', { ip });
        return { error: INVALID_CREDENTIALS, values: { email } };
    }

    clearFailures(limiterKey);

    if (user.totpEnabled && user.totpSecret) {
        await createSession(user.id, { pendingTotp: true });
        redirect(routes.twoFactor);
    }

    logActivity(user.id, 'auth.signin', 'Signed in', { ip });
    await createSession(user.id);
    redirect(routes.home);
}

export async function verifyTwoFactor(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const current = await getSession();
    if (!current) redirect(routes.signIn);
    if (!current.session.pendingTotp) redirect(routes.home);

    const { user, session } = current;
    const limiterKey = `totp:${user.id}`;
    if (isRateLimited(limiterKey)) {
        await destroySession();
        redirect(routes.signIn);
    }

    const code = String(formData.get('code') ?? '');
    if (!user.totpSecret || !verifyTotp(user.email, user.totpSecret, code)) {
        recordFailure(limiterKey);
        return { error: 'That code is not valid', fieldErrors: { code: 'That code is not valid' } };
    }

    clearFailures(limiterKey);
    await completeTotp(session.id);
    logActivity(user.id, 'auth.signin', 'Signed in with 2FA', { ip: session.ip });
    redirect(routes.home);
}

export async function signOut() {
    await destroySession();
    redirect(routes.signIn);
}
