import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import AuthShell, { AuthHeading } from '@/components/auth/auth-shell';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import Password from '@/components/ui/forms/password';
import CurrencySelect from '@/components/finance/currency-select';
import { hasOwner } from '@/server/auth/owner';
import { setupOwner } from '@/app/auth/actions';
import { PASSWORD_RULES } from '@/server/auth/password';
import routes from '@/config/routes';

export const metadata: Metadata = { title: 'Set up LifePlanner' };

export default async function SetupPage() {
    await connection();
    if (hasOwner()) redirect(routes.signIn);

    return (
        <AuthShell>
            <AuthHeading
                emoji="🌱"
                title="Set up your planner"
                subtitle="Create the owner account. Everything stays on this server."
            />
            <ActionForm action={setupOwner} className="space-y-4 pt-4 lg:space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="First name" name="firstName" autoComplete="given-name" required />
                    <Input label="Other names" name="otherNames" autoComplete="family-name" />
                </div>
                <Input label="Email Address" name="email" type="email" autoComplete="username" required />
                <CurrencySelect label="Main currency" name="currency" defaultValue="USD" />
                <Password
                    label="Password"
                    name="password"
                    autoComplete="new-password"
                    helpText={`${PASSWORD_RULES} A passphrase works well.`}
                    required
                />
                <Password label="Confirm password" name="confirmPassword" autoComplete="new-password" required />
                <SubmitButton className="!mt-6 w-full text-sm">Create account</SubmitButton>
            </ActionForm>
        </AuthShell>
    );
}
