import fs from 'node:fs';
import { Readable } from 'node:stream';
import { getSession } from '@/server/auth/session';
import { backupPath } from '@/server/backups';

/** Downloads a backup from the backups folder (signed-in owner only). */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
    const current = await getSession();
    if (!current || current.session.pendingTotp) return new Response('Not found', { status: 404 });

    const { name } = await params;
    const file = backupPath(decodeURIComponent(name));
    if (!file || !fs.existsSync(file)) return new Response('Not found', { status: 404 });

    return new Response(Readable.toWeb(fs.createReadStream(file)) as ReadableStream, {
        headers: {
            'Content-Type': 'application/vnd.sqlite3',
            'Content-Length': String(fs.statSync(file).size),
            'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
