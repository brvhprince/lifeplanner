import { maskAccountNumber } from '@/lib/accounts';

/** "GCB · •••• 4821" under an account's name; a long bank name truncates, the number never does. */
export default function AccountMeta({ institution, accountNumber }: { institution: string | null; accountNumber: string | null }) {
    const masked = maskAccountNumber(accountNumber);
    if (!institution && !masked) return null;
    return (
        <div className="flex min-w-0 gap-1 text-caption tabular-nums text-body-muted">
            {institution && <span className="truncate">{institution}</span>}
            {institution && masked && <span aria-hidden>·</span>}
            {masked && <span className="shrink-0">{masked}</span>}
        </div>
    );
}
