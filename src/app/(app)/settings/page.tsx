import type { Metadata } from 'next';
import Image from 'next/image';
import { and, desc, eq, gt } from 'drizzle-orm';
import Button from '@/components/ui/button';
import { Badge, Card, CardTitle, PageHeader } from '@/components/ui/card';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import Password from '@/components/ui/forms/password';
import CurrencySelect from '@/components/finance/currency-select';
import { db, schema } from '@/server/db';
import { getSession, requireUser } from '@/server/auth/session';
import { totpQr } from '@/server/auth/totp';
import { PASSWORD_RULES } from '@/server/auth/password';
import { EXPORTS } from '@/server/export';
import { vapidPublicKey } from '@/server/push';
import { removePushSubscription, updateNotificationSettings } from '@/server/push-actions';
import PushSettings from '@/components/layout/push-settings';
import Select from '@/components/ui/forms/select';
import {
    cancelTotpSetup,
    changePassword,
    confirmTotp,
    disableTotp,
    signOutOtherSessions,
    startTotpSetup,
    updateProfile,
} from './actions';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
    const user = await requireUser();
    const current = await getSession();

    const activeSessions = db
        .select()
        .from(schema.sessions)
        .where(and(eq(schema.sessions.userId, user.id), gt(schema.sessions.expiresAt, new Date())))
        .orderBy(desc(schema.sessions.createdAt))
        .all();

    const activity = db
        .select()
        .from(schema.activities)
        .where(eq(schema.activities.userId, user.id))
        .orderBy(desc(schema.activities.createdAt))
        .limit(10)
        .all();

    const pendingTotp = !user.totpEnabled && user.totpSecret ? await totpQr(user.email, user.totpSecret) : null;

    const devices = db
        .select()
        .from(schema.pushSubscriptions)
        .where(eq(schema.pushSubscriptions.userId, user.id))
        .orderBy(desc(schema.pushSubscriptions.createdAt))
        .all();

    return (
        <>
            <PageHeader title="Settings" subtitle={user.email} />
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardTitle>Profile</CardTitle>
                    <ActionForm action={updateProfile} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="First name" name="firstName" defaultValue={user.firstName} required />
                            <Input label="Other names" name="otherNames" defaultValue={user.otherNames} />
                        </div>
                        <CurrencySelect label="Main currency" name="currency" defaultValue={user.currency} />
                        <SubmitButton className="text-sm">Save profile</SubmitButton>
                    </ActionForm>
                </Card>

                <Card>
                    <CardTitle>Password</CardTitle>
                    <ActionForm action={changePassword} className="space-y-4">
                        <Password label="Current password" name="currentPassword" autoComplete="current-password" required />
                        <Password label="New password" name="newPassword" autoComplete="new-password" helpText={PASSWORD_RULES} required />
                        <Password label="Confirm new password" name="confirmPassword" autoComplete="new-password" required />
                        <SubmitButton className="text-sm">Change password</SubmitButton>
                    </ActionForm>
                </Card>

                <Card>
                    <CardTitle action={user.totpEnabled ? <Badge tone="brand">On</Badge> : <Badge>Off</Badge>}>
                        Two-factor authentication
                    </CardTitle>
                    {user.totpEnabled ? (
                        <ActionForm action={disableTotp} className="space-y-4">
                            <p className="text-body-2">Sign-ins need a code from your authenticator app.</p>
                            <Password label="Current password" name="currentPassword" autoComplete="current-password" required />
                            <SubmitButton variant="solidDanger" className="text-sm">
                                Turn off 2FA
                            </SubmitButton>
                        </ActionForm>
                    ) : pendingTotp ? (
                        <div className="space-y-4">
                            <p className="text-body-2">
                                Scan this code with an authenticator app (Aegis, 1Password, Google Authenticator...), then enter
                                the 6-digit code it shows.
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <Image
                                    src={pendingTotp.qrDataUrl}
                                    alt="QR code for your authenticator app"
                                    width={160}
                                    height={160}
                                    unoptimized
                                    className="rounded-lg bg-white p-1"
                                />
                                <div className="min-w-0 text-caption">
                                    <div className="text-body-muted">Or enter this key manually:</div>
                                    <code className="break-all font-semibold">{pendingTotp.secret}</code>
                                </div>
                            </div>
                            <ActionForm action={confirmTotp} className="space-y-4">
                                <Input label="Code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required />
                                <div className="flex gap-2">
                                    <SubmitButton className="text-sm">Turn on 2FA</SubmitButton>
                                </div>
                            </ActionForm>
                            <form action={cancelTotpSetup}>
                                <button type="submit" className="text-sm font-semibold text-body-muted hover:text-brand">
                                    Cancel
                                </button>
                            </form>
                        </div>
                    ) : (
                        <form action={startTotpSetup} className="space-y-4">
                            <p className="text-body-2">Add a second step to sign-in using an authenticator app.</p>
                            <Button className="text-sm">Set up 2FA</Button>
                        </form>
                    )}
                </Card>

                <Card>
                    <CardTitle
                        action={
                            activeSessions.length > 1 && (
                                <form action={signOutOtherSessions}>
                                    <button type="submit" className="text-sm font-semibold text-brand hover:text-brand-light">
                                        Sign out others
                                    </button>
                                </form>
                            )
                        }
                    >
                        Sessions
                    </CardTitle>
                    <ul className="divide-y divide-light-300 text-body-2 dark:divide-dark-light/20">
                        {activeSessions.map((s) => (
                            <li key={s.id} className="py-2">
                                <div className="flex items-center gap-2 font-medium">
                                    <span className="truncate">{s.userAgent ?? 'Unknown device'}</span>
                                    {s.id === current?.session.id && <Badge tone="brand">This device</Badge>}
                                </div>
                                <div className="text-caption text-body-muted">
                                    {s.ip ?? 'unknown IP'} · since {s.createdAt.toLocaleString()}
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="lg:col-span-2">
                    <CardTitle>Notifications</CardTitle>
                    <div className="grid gap-8 lg:grid-cols-2">
                        <ActionForm action={updateNotificationSettings} className="space-y-4">
                            <Select
                                label="Heads-up before bills, loans and deadlines"
                                name="notifyDaysBefore"
                                defaultValue={String(user.notifyDaysBefore)}
                                options={[
                                    { value: '0', label: 'Only on the day' },
                                    { value: '1', label: '1 day before' },
                                    { value: '2', label: '2 days before' },
                                    { value: '3', label: '3 days before' },
                                    { value: '5', label: '5 days before' },
                                    { value: '7', label: '1 week before' },
                                    { value: '14', label: '2 weeks before' },
                                ]}
                                helpText="You also get a notification on the day and if something becomes overdue. Reminders arrive at their set time."
                            />
                            <SubmitButton className="text-sm">Save</SubmitButton>
                        </ActionForm>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-2 text-body-2 font-semibold">Phone and desktop notifications</div>
                                <PushSettings publicKey={vapidPublicKey()} />
                            </div>
                            {devices.length > 0 && (
                                <ul className="divide-y divide-light-300 text-body-2 dark:divide-dark-light/20">
                                    {devices.map((d) => (
                                        <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">{d.label ?? 'Device'}</span>
                                                <span className="block text-caption text-body-muted">
                                                    Added {d.createdAt.toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                    {d.lastSuccessAt &&
                                                        ` · last delivered ${d.lastSuccessAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`}
                                                </span>
                                            </span>
                                            <form action={removePushSubscription.bind(null, d.id)}>
                                                <button type="submit" className="text-sm font-semibold text-body-muted hover:text-danger-dark">
                                                    Remove
                                                </button>
                                            </form>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="lg:col-span-2">
                    <CardTitle>Your data</CardTitle>
                    <p className="mb-4 text-body-2">
                        Everything you record is yours. Download it any time; the CSV files open in Excel, Numbers or Google Sheets.
                    </p>
                    <div className="mb-5 flex flex-wrap gap-3">
                        <a href="/export/lifeplanner.json" className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
                            Everything (JSON)
                        </a>
                        <a
                            href="/export/lifeplanner.db"
                            className="rounded border border-light-500 px-4 py-2.5 text-sm font-semibold hover:bg-grey-200 dark:border-dark-600 dark:hover:bg-dark-light/30"
                        >
                            Full backup (SQLite)
                        </a>
                    </div>
                    <div className="mb-2 text-caption font-semibold uppercase tracking-wide text-body-muted">CSV by section</div>
                    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        {EXPORTS.map((e) => (
                            <li key={e.name}>
                                <a href={`/export/${e.name}`} className="font-semibold text-brand hover:text-brand-light">
                                    {e.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4 text-caption text-body-muted">
                        The SQLite backup contains your password hash and encrypted 2FA secret, so store it somewhere safe. Uploaded files are
                        not included; back up the <code>uploads</code> folder for those.
                    </p>
                </Card>

                <Card className="lg:col-span-2">
                    <CardTitle>Recent security activity</CardTitle>
                    <ul className="divide-y divide-light-300 text-body-2 dark:divide-dark-light/20">
                        {activity.map((a) => (
                            <li key={a.id} className="flex justify-between gap-4 py-2">
                                <span>{a.description ?? a.action}</span>
                                <span className="shrink-0 text-caption text-body-muted">{a.createdAt.toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </>
    );
}
