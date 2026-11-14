import { getSession } from '@/server/auth/session';
import { latestUnread, unreadCount } from '@/server/notifications';

/** Unread count and newest items, polled by the notification bell. */
export async function GET() {
    const current = await getSession();
    if (!current || current.session.pendingTotp) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    return Response.json(
        { count: unreadCount(current.user.id), latest: latestUnread(current.user.id) },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
