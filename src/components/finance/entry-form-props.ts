import type { EntryFormAccount, EntryFormCategory, EntryFormPerson } from '@/components/finance/entry-form';

/** Picks only the fields the client entry form needs. */
export function entryFormProps(
    accounts: EntryFormAccount[],
    categories: EntryFormCategory[],
    people: EntryFormPerson[] = []
): { accounts: EntryFormAccount[]; categories: EntryFormCategory[]; people: EntryFormPerson[] } {
    return {
        accounts: accounts.map(({ id, name, currency, isPrimary, accountNumber }) => ({ id, name, currency, isPrimary, accountNumber })),
        categories: categories.map(({ id, name, kind }) => ({ id, name, kind })),
        people: people.map(({ id, name }) => ({ id, name })),
    };
}
