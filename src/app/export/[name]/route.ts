import { getSession } from '@/server/auth/session';
import { buildExport } from '@/server/export';
import { logActivity } from '@/server/activity';

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
    const current = await getSession();
    if (!current || current.session.pendingTotp) return new Response('Not found', { status: 404 });

    const { name } = await params;
    const file = await buildExport(name, current.user.id);
    if (!file) return new Response('Not found', { status: 404 });

    if (name === 'lifeplanner.db' || name === 'lifeplanner.json') {
        logActivity(current.user.id, 'data.export', `Downloaded ${name}`);
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = name.replace(/(\.\w+)$/, `-${stamp}$1`);
    return new Response(file.body, {
        headers: {
            'Content-Type': file.type,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
