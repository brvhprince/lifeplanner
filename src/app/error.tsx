'use client';

import Button from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
            <h1 className="text-heading-2 font-semibold text-heading-dark dark:text-heading-light">
                Something went wrong
            </h1>
            <p className="max-w-md text-body-muted">
                {error.digest ? `Error reference: ${error.digest}. Check the server logs for details.` : error.message}
            </p>
            <Button onClick={reset}>Try again</Button>
        </main>
    );
}
