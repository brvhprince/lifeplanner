import type { EntryFormAccount, EntryFormCategory } from '@/components/finance/entry-form';

/** Picks only the fields the client entry form needs. */
export function entryFormProps(
    accounts: EntryFormAccount[],
    categories: EntryFormCategory[]
): { accounts: EntryFormAccount[]; categories: EntryFormCategory[] } {
    return {
        accounts: accounts.map(({ id, name, currency, isPrimary }) => ({ id, name, currency, isPrimary })),
        categories: categories.map(({ id, name, kind }) => ({ id, name, kind })),
    };
}
