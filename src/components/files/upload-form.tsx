'use client';

import { useState } from 'react';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import type { FormAction } from '@/lib/action-state';
import { ACCEPT, MAX_FILE_BYTES, formatBytes } from '@/lib/files';

export default function UploadForm({ action }: { action: FormAction }) {
    const [selected, setSelected] = useState<File[]>([]);
    const tooBig = selected.filter((f) => f.size > MAX_FILE_BYTES);

    return (
        <ActionForm action={action} onReset={() => setSelected([])} className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-light-500 px-4 py-6 text-center text-body-2 hover:border-brand dark:border-dark-light/40">
                <span className="font-semibold text-brand">Choose files</span>
                <span className="text-caption text-body-muted">Photos, PDFs, documents · up to 25 MB each</span>
                <input
                    type="file"
                    name="files"
                    multiple
                    accept={ACCEPT}
                    className="sr-only"
                    onChange={(e) => setSelected(Array.from(e.target.files ?? []))}
                />
            </label>
            {selected.length > 0 && (
                <ul className="space-y-1 text-caption">
                    {selected.map((f) => (
                        <li key={`${f.name}-${f.size}`} className={f.size > MAX_FILE_BYTES ? 'text-danger-dark' : 'text-body-muted'}>
                            {f.name} · {formatBytes(f.size)}
                        </li>
                    ))}
                </ul>
            )}
            {selected.length > 0 && tooBig.length === 0 && (
                <SubmitButton className="text-sm">Upload {selected.length === 1 ? 'file' : `${selected.length} files`}</SubmitButton>
            )}
        </ActionForm>
    );
}
