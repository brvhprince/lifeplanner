import fs from 'node:fs';
import { Readable } from 'node:stream';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { getSession } from '@/server/auth/session';
import { absolutePath } from '@/server/files';

const INLINE = /^(image\/(jpeg|png|webp|gif|avif)|application\/pdf|text\/plain|audio\/|video\/)/;

/** Serves an uploaded file to its owner only. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const current = await getSession();
    if (!current || current.session.pendingTotp) return new Response('Not found', { status: 404 });

    const { id } = await params;
    const f = schema.files;
    const file = db.select().from(f).where(and(eq(f.id, id), eq(f.userId, current.user.id))).get();
    if (!file) return new Response('Not found', { status: 404 });

    const full = absolutePath(file.path);
    if (!fs.existsSync(full)) return new Response('File is missing from storage', { status: 410 });

    const download = new URL(request.url).searchParams.has('download');
    const disposition = !download && INLINE.test(file.mimeType) ? 'inline' : 'attachment';
    const headers = new Headers({
        'Content-Type': file.mimeType,
        'Content-Length': String(file.size),
        'Content-Disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
    });
    // PDFs need the browser's viewer; everything else gets a locked-down sandbox.
    if (file.mimeType !== 'application/pdf') headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self'; media-src 'self'; sandbox");

    return new Response(Readable.toWeb(fs.createReadStream(full)) as ReadableStream, { headers });
}
