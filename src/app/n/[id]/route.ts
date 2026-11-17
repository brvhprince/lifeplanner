import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { getSession } from '@/server/auth/session';

/** Opened from a push notification: marks it read and goes to what it's about. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const current = await getSession();
    if (!current || current.session.pendingTotp) return NextResponse.redirect(new URL('/auth/sign-in', request.url));

    const { id } = await params;
    const n = schema.notifications;
    const row = db.select().from(n).where(and(eq(n.id, id), eq(n.userId, current.user.id))).get();
    if (!row) return NextResponse.redirect(new URL('/notifications', request.url));

    if (!row.readAt) db.update(n).set({ readAt: new Date() }).where(eq(n.id, id)).run();
    // Only ever redirect within the app.
    const target = row.href?.startsWith('/') && !row.href.startsWith('//') ? row.href : '/notifications';
    return NextResponse.redirect(new URL(target, request.url));
}
