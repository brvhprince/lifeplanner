import { maskAccountNumber } from '@/lib/accounts';

/** "GCB · •••• 4821" under an account's name, when either is set. */
export default function AccountMeta({ institution, accountNumber }: { institution: string | null; accountNumber: string | null }) {
    const text = [institution, maskAccountNumber(accountNumber)].filter(Boolean).join(' · ');
    return text ? <div className="truncate text-caption tabular-nums text-body-muted">{text}</div> : null;
}
