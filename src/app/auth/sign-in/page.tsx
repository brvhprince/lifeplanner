/**
 * Project: lifeplanner-webapp
 * File: page
 * Created by pennycodes on 10/08/2023.
 * Copyright lifeplanner-webapp
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import AuthShell, { AuthHeading } from '@/components/auth/auth-shell';
import LoginUserForm from '@/components/auth/login-form';
import { hasOwner } from '@/server/auth/owner';
import { getSession } from '@/server/auth/session';
import routes from '@/config/routes';

export const metadata: Metadata = { title: 'Sign In' };

export default async function SignIn() {
    await connection();
    if (!hasOwner()) redirect(routes.setup);
    const current = await getSession();
    if (current && !current.session.pendingTotp) redirect(routes.home);

    return (
        <AuthShell>
            <AuthHeading emoji="👋" title="Welcome Back!" subtitle="Let's plan your life" />
            <LoginUserForm />
            <p className="mt-6 text-center text-xs text-body-muted">
                Forgot your password? Run <code className="font-semibold">npm run lp reset-password</code> on the
                server.
            </p>
        </AuthShell>
    );
}
