import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuthShell, { AuthHeading } from '@/components/auth/auth-shell';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import { getSession } from '@/server/auth/session';
import { signOut, verifyTwoFactor } from '@/app/auth/actions';
import routes from '@/config/routes';

export const metadata: Metadata = { title: 'Two-factor verification' };

export default async function TwoFactorPage() {
    const current = await getSession();
    if (!current) redirect(routes.signIn);
    if (!current.session.pendingTotp) redirect(routes.home);

    return (
        <AuthShell>
            <AuthHeading emoji="🔐" title="Two-factor check" subtitle="Enter the 6-digit code from your authenticator app" />
            <ActionForm action={verifyTwoFactor} className="space-y-4 pt-4 lg:space-y-5">
                <Input
                    label="Authentication code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9 ]*"
                    maxLength={7}
                    autoFocus
                    required
                />
                <SubmitButton className="!mt-5 w-full text-sm lg:!mt-7">Verify</SubmitButton>
            </ActionForm>
            <form action={signOut} className="mt-4 text-center">
                <button type="submit" className="text-sm font-semibold text-brand hover:text-brand-light">
                    Use a different account
                </button>
            </form>
        </AuthShell>
    );
}
