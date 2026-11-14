'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/server/db';
import { getSession, requireUser } from '@/server/auth/session';
import { hashPassword, passwordProblem, verifyPassword } from '@/server/auth/password';
import { generateTotp, verifyTotp } from '@/server/auth/totp';
import { logActivity } from '@/server/activity';
import { formValues, parseForm, type ActionState } from '@/lib/action-state';
import { isCurrency } from '@/lib/money';

const { users, sessions } = schema;

const profileSchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    otherNames: z.string().trim().max(200).default(''),
    currency: z.string().trim().toUpperCase().refine(isCurrency, 'Choose a valid currency'),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const parsed = parseForm(profileSchema, formData);
    if (!parsed.data) return parsed.state;

    db.update(users).set(parsed.data).where(eq(users.id, user.id)).run();
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Profile updated' };
}

async function checkCurrentPassword(passwordHash: string, formData: FormData): Promise<ActionState | null> {
    const ok = await verifyPassword(passwordHash, String(formData.get('currentPassword') ?? ''));
    if (ok) return null;
    return { error: 'Current password is incorrect', fieldErrors: { currentPassword: 'Current password is incorrect' }, values: formValues(formData) };
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const failed = await checkCurrentPassword(user.passwordHash, formData);
    if (failed) return failed;

    const password = String(formData.get('newPassword') ?? '');
    const problem = passwordProblem(password);
    if (problem) return { error: problem, fieldErrors: { newPassword: problem } };
    if (password !== formData.get('confirmPassword')) {
        return { error: 'Passwords do not match', fieldErrors: { confirmPassword: 'Passwords do not match' } };
    }

    db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, user.id)).run();
    await endOtherSessions(user.id);
    logActivity(user.id, 'auth.password_changed', 'Password changed; other sessions signed out');
    return { ok: true, message: 'Password changed. Other devices were signed out.' };
}

/** Generates a fresh (not yet enabled) TOTP secret for the setup screen. */
export async function startTotpSetup() {
    const user = await requireUser();
    if (user.totpEnabled) return;
    const { encryptedSecret } = await generateTotp(user.email);
    db.update(users).set({ totpSecret: encryptedSecret }).where(eq(users.id, user.id)).run();
    revalidatePath('/settings');
}

export async function confirmTotp(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    if (user.totpEnabled || !user.totpSecret) return { error: 'Start the setup again' };

    if (!verifyTotp(user.email, user.totpSecret, String(formData.get('code') ?? ''))) {
        return { error: 'That code is not valid', fieldErrors: { code: 'That code is not valid' } };
    }

    db.update(users).set({ totpEnabled: true }).where(eq(users.id, user.id)).run();
    logActivity(user.id, 'auth.2fa_enabled', 'Two-factor authentication enabled');
    revalidatePath('/settings');
    return { ok: true, message: 'Two-factor authentication is on' };
}

export async function cancelTotpSetup() {
    const user = await requireUser();
    if (user.totpEnabled) return;
    db.update(users).set({ totpSecret: null }).where(eq(users.id, user.id)).run();
    revalidatePath('/settings');
}

export async function disableTotp(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireUser();
    const failed = await checkCurrentPassword(user.passwordHash, formData);
    if (failed) return failed;

    db.update(users).set({ totpEnabled: false, totpSecret: null }).where(eq(users.id, user.id)).run();
    logActivity(user.id, 'auth.2fa_disabled', 'Two-factor authentication disabled');
    revalidatePath('/settings');
    return { ok: true, message: 'Two-factor authentication is off' };
}

async function endOtherSessions(userId: string) {
    const current = await getSession();
    db.delete(sessions)
        .where(and(eq(sessions.userId, userId), current ? ne(sessions.id, current.session.id) : undefined))
        .run();
}

export async function signOutOtherSessions() {
    const user = await requireUser();
    await endOtherSessions(user.id);
    logActivity(user.id, 'auth.sessions_revoked', 'Signed out other sessions');
    revalidatePath('/settings');
}
