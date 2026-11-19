import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import Button from '@/components/ui/button';
import { Badge, Card, CardTitle, EmptyState } from '@/components/ui/card';
import ConfirmButton from '@/components/ui/confirm-button';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Password from '@/components/ui/forms/password';
import { listBackups } from '@/server/backups';
import { backupNow, deleteBackup, restoreFromBackup, uploadAndRestore } from '@/server/backup-actions';
import { formatBytes } from '@/lib/files';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const kind = (name: string) =>
    name.startsWith('before-start-over')
        ? 'Before start over'
        : name.startsWith('before-restore')
          ? 'Before a restore'
          : name.startsWith('uploaded')
            ? 'Uploaded'
            : name.startsWith('manual')
              ? 'Manual'
              : 'Backup';

/** Backups folder: back up now, download, restore (password required) and delete. */
export default function BackupsCard() {
    const backups = listBackups();

    return (
        <Card className="lg:col-span-2">
            <CardTitle
                action={
                    <form action={backupNow}>
                        <Button variant="outline" className="text-sm">
                            Back up now
                        </Button>
                    </form>
                }
            >
                Backups
            </CardTitle>
            <p className="mb-4 text-body-2 text-body-muted">
                Full copies of your data, kept in the <code>backups</code> folder next to the database. Restoring replaces everything with
                the backup (your current data is backed up first) and signs you out: sign in with the password you had when the backup was
                made.
            </p>

            {backups.length ? (
                <ul className="mb-6 divide-y divide-light-300 dark:divide-dark-light/20">
                    {backups.map((b) => (
                        <li key={b.name} className="py-3">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="font-medium">
                                    {b.modified.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                                <Badge>{kind(b.name)}</Badge>
                                {b.problem && <Badge tone="danger">{b.problem}</Badge>}
                                <span className="text-caption text-body-muted">
                                    {formatBytes(b.size)}
                                    {b.summary &&
                                        ` · ${plural(b.summary.accounts, 'account')} · ${plural(b.summary.transactions, 'transaction')} · ${plural(b.summary.loans, 'loan')} · ${b.summary.people} ${b.summary.people === 1 ? 'person' : 'people'}`}
                                </span>
                                <a
                                    href={`/backups/${encodeURIComponent(b.name)}`}
                                    className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-light"
                                >
                                    <HiOutlineArrowDownTray className="h-4 w-4" aria-hidden="true" /> Download
                                </a>
                            </div>
                            <div className="mt-2 flex flex-wrap items-start gap-4">
                                {!b.problem && (
                                    <details className="group">
                                        <summary className="cursor-pointer text-sm font-semibold text-body-muted hover:text-brand">Restore…</summary>
                                        <ActionForm action={restoreFromBackup.bind(null, b.name)} className="mt-2 flex flex-wrap items-end gap-3">
                                            <Password label="Your current password" name="password" autoComplete="current-password" className="w-64" />
                                            <SubmitButton variant="solidDanger" className="text-sm">
                                                Restore this backup
                                            </SubmitButton>
                                        </ActionForm>
                                    </details>
                                )}
                                <ConfirmButton action={deleteBackup.bind(null, b.name)} label="Delete" warning="Delete this backup file?" />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="mb-6">
                    <EmptyState title="No backups yet">Use “Back up now”, or they’re created automatically before Start over and restores.</EmptyState>
                </div>
            )}

            <details>
                <summary className="cursor-pointer text-sm font-semibold text-brand">Restore from a file…</summary>
                <ActionForm action={uploadAndRestore} className="mt-3 grid gap-3 sm:grid-cols-[1fr_16rem_auto] sm:items-end">
                    <label className="block text-label font-medium">
                        <span className="block pb-1.5 text-body-light dark:text-body-dark">Backup file (.db, up to 25 MB)</span>
                        <input
                            type="file"
                            name="backup"
                            accept=".db,application/vnd.sqlite3,application/x-sqlite3"
                            className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-semibold file:text-brand-dark"
                        />
                    </label>
                    <Password label="Your current password" name="password" autoComplete="current-password" />
                    <SubmitButton variant="solidDanger" className="text-sm">
                        Upload and restore
                    </SubmitButton>
                </ActionForm>
                <p className="mt-2 text-caption text-body-muted">
                    A backup from another installation also needs that installation’s <code>secret.key</code> for two-factor sign-in; without
                    it, turn 2FA off with <code>lp disable-2fa</code>.
                </p>
            </details>
        </Card>
    );
}
