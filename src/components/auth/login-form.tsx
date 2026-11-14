/**
 * Project: lifeplanner-webapp
 * File: login-form
 * Created by pennycodes on 10/08/2023.
 * Copyright lifeplanner-webapp
 */
'use client';

import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Password from '@/components/ui/forms/password';
import Input from '@/components/ui/forms/input';
import { signIn } from '@/app/auth/actions';

export default function LoginUserForm() {
    return (
        <ActionForm action={signIn} className="space-y-4 pt-4 lg:space-y-5">
            <Input
                label="Email Address"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="Enter your email address"
                required
            />
            <Password
                label="Password"
                name="password"
                autoComplete="current-password"
                placeholder="Type your password"
                required
            />
            <SubmitButton className="!mt-5 w-full text-sm tracking-[0.2px] lg:!mt-7">Sign In</SubmitButton>
        </ActionForm>
    );
}
