/* eslint-disable @next/next/no-img-element -- files are served by an authenticated route the image optimiser can't call */
import { HiOutlineDocument, HiOutlineTrash } from 'react-icons/hi2';
import { Card, CardTitle } from '@/components/ui/card';
import UploadForm from '@/components/files/upload-form';
import { deleteAttachment, uploadAttachments } from '@/server/attachment-actions';
import { listAttachments } from '@/server/files';
import { formatBytes, isPreviewableImage } from '@/lib/files';

export default function AttachmentsPanel({
    userId,
    entityType,
    entityId,
    page,
    title = 'Files & photos',
}: {
    userId: string;
    entityType: string;
    entityId: string;
    page: string;
    title?: string;
}) {
    const items = listAttachments(userId, entityType, entityId);
    const images = items.filter((i) => isPreviewableImage(i.mimeType));
    const others = items.filter((i) => !isPreviewableImage(i.mimeType));

    const remove = (id: string, name: string) => (
        <form action={deleteAttachment.bind(null, id, page)}>
            <button
                type="submit"
                aria-label={`Remove ${name}`}
                className="rounded bg-white/90 p-1.5 text-body-muted hover:text-danger-dark dark:bg-dark/90"
            >
                <HiOutlineTrash className="h-4 w-4" />
            </button>
        </form>
    );

    return (
        <Card>
            <CardTitle>{title}</CardTitle>
            {images.length > 0 && (
                <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((img) => (
                        <li key={img.id} className="group relative overflow-hidden rounded-lg bg-grey-200 dark:bg-dark-dark">
                            <a href={`/files/${img.id}`} target="_blank" rel="noopener">
                                <img src={`/files/${img.id}`} alt={img.name} loading="lazy" className="aspect-square w-full object-cover" />
                            </a>
                            <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                                {remove(img.id, img.name)}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {others.length > 0 && (
                <ul className="mb-4 divide-y divide-light-300 dark:divide-dark-light/20">
                    {others.map((f) => (
                        <li key={f.id} className="flex items-center gap-3 py-2">
                            <HiOutlineDocument className="h-5 w-5 shrink-0 text-body-muted" aria-hidden="true" />
                            <a href={`/files/${f.id}`} target="_blank" rel="noopener" className="min-w-0 flex-1 truncate text-body-2 font-medium hover:text-brand">
                                {f.name}
                            </a>
                            <span className="shrink-0 text-caption text-body-muted">{formatBytes(f.size)}</span>
                            {remove(f.id, f.name)}
                        </li>
                    ))}
                </ul>
            )}
            <UploadForm action={uploadAttachments.bind(null, entityType, entityId)} />
        </Card>
    );
}
