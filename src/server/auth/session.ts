import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { randomToken, sha256 } from '@/server/crypto';
import { SESSION_DAYS } from '@/server/env';
import routes from '@/config/routes';

export const SESSION_COOKIE = 'lp_session';
const PENDING_TOTP_MINUTES = 10;

async function isSecureRequest() {
    if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === 'true';
    return (await headers()).get('x-forwarded-proto') === 'https';
}

export async function requestInfo() {
    const h = await headers();
    return {
        ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null,
        userAgent: h.get('user-agent'),
    };
}

/** Creates a session and sets its cookie. Must be called from a Server Action. */
export async function createSession(userId: string, { pendingTotp = false } = {}) {
    const token = randomToken();
    const lifetimeMs = pendingTotp ? PENDING_TOTP_MINUTES * 60_000 : SESSION_DAYS * 86_400_000;
    const expiresAt = new Date(Date.now() + lifetimeMs);
    const { ip, userAgent } = await requestInfo();

    db.insert(schema.sessions)
        .values({ id: sha256(token), userId, pendingTotp, ip, userAgent, expiresAt })
        .run();

    (await cookies()).set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: await isSecureRequest(),
        path: '/',
        expires: expiresAt,
    });
}

/** Upgrades a pending-2FA session to a full session. */
export async function completeTotp(sessionId: string) {
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
    db.update(schema.sessions)
        .set({ pendingTotp: false, expiresAt })
        .where(eq(schema.sessions.id, sessionId))
        .run();

    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token) {
        jar.set(SESSION_COOKIE, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: await isSecureRequest(),
            path: '/',
            expires: expiresAt,
        });
    }
}

/** Resolves the current session (deduplicated per request). */
export const getSession = cache(async () => {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const id = sha256(token);
    const row = db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).get();
    if (!row) return null;

    if (row.expiresAt.getTime() < Date.now()) {
        db.delete(schema.sessions).where(eq(schema.sessions.id, id)).run();
        return null;
    }

    const user = db.select().from(schema.users).where(eq(schema.users.id, row.userId)).get();
    if (!user) return null;

    return { session: row, user };
});

/** Returns the signed-in user or redirects to sign in. */
export async function requireUser() {
    const current = await getSession();
    if (!current) redirect(routes.signIn);
    if (current.session.pendingTotp) redirect(routes.twoFactor);
    return current.user;
}

export async function destroySession() {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token) {
        db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token))).run();
    }
    jar.delete(SESSION_COOKIE);
}
