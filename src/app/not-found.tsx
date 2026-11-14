import Link from '@/components/ui/link';
import routes from '@/config/routes';

export default function NotFound() {
    return (
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
            <h1 className="text-heading-2 font-semibold text-heading-dark dark:text-heading-light">Not found</h1>
            <p className="text-body-muted">That page or record doesn&apos;t exist.</p>
            <Link href={routes.home} className="font-semibold text-brand hover:text-brand-light">
                Back to dashboard
            </Link>
        </main>
    );
}
