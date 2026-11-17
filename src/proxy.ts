import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'lp_session';

/**
 * Optimistic check only: sends visitors without a session cookie to sign in.
 * The real session validation happens server-side in `requireUser()`.
 */
export function proxy(req: NextRequest) {
    if (!req.cookies.has(SESSION_COOKIE)) {
        return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }
}

export const config = {
    matcher: ['/((?!auth|setup|_next/static|_next/image|emojis|icons|sw.js|favicon.ico|manifest.webmanifest|icon).*)'],
};
