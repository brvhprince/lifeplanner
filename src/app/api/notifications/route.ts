import { getSession } from '@/server/auth/session';
import { unreadCount } from '@/server/notifications';

/** Unread count, polled by the notification bell. */
export async function GET() {
    const current = await getSession();
    if (!current || current.session.pendingTotp) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    return Response.json({ count: unreadCount(current.user.id) }, { headers: { 'Cache-Control': 'no-store' } });
}
