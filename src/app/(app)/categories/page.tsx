import type { Metadata } from 'next';
import { HiOutlineArchiveBox } from 'react-icons/hi2';
import { Card, CardTitle, EmptyState, PageHeader } from '@/components/ui/card';
import { ActionForm, SubmitButton } from '@/components/ui/forms/action-form';
import Input from '@/components/ui/forms/input';
import Select from '@/components/ui/forms/select';
import { requireUser } from '@/server/auth/session';
import { listCategories } from '@/server/finance/queries';
import { archiveCategory, createCategory, restoreCategory, updateCategory } from '@/server/finance/actions';
import type { Category } from '@/server/db/schema';

export const metadata: Metadata = { title: 'Categories' };

function CategoryRow({ c }: { c: Category }) {
    return (
        <li className="py-2">
            <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ background: c.color ?? '#A6B7D4' }} aria-hidden="true" />
                    <span className="flex-1 text-body-2 font-medium">{c.name}</span>
                    <span className="text-caption font-semibold text-brand group-open:hidden">Edit</span>
                </summary>
                <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-grey-100 p-3 dark:bg-dark-dark">
                    <ActionForm action={updateCategory.bind(null, c.id)} className="flex flex-1 flex-wrap items-end gap-3">
                        <Input label="Name" name="name" defaultValue={c.name} maxLength={60} className="min-w-[140px] flex-1" />
                        <Input label="Colour" name="color" type="color" defaultValue={c.color ?? '#A6B7D4'} inputClassName="!w-16 !p-1" />
                        <SubmitButton className="text-sm">Save</SubmitButton>
                    </ActionForm>
                    <form action={archiveCategory.bind(null, c.id)}>
                        <button
                            type="submit"
                            className="flex items-center gap-1 rounded px-2 py-2 text-sm font-semibold text-body-muted hover:text-danger-dark"
                        >
                            <HiOutlineArchiveBox className="h-4 w-4" /> Archive
                        </button>
                    </form>
                </div>
            </details>
        </li>
    );
}

function CategoryList({ title, items }: { title: string; items: Category[] }) {
    return (
        <Card>
            <CardTitle>{title}</CardTitle>
            {items.length ? (
                <ul className="divide-y divide-light-300 dark:divide-dark-light/20">
                    {items.map((c) => (
                        <CategoryRow key={c.id} c={c} />
                    ))}
                </ul>
            ) : (
                <EmptyState title="None yet" />
            )}
        </Card>
    );
}

export default async function CategoriesPage() {
    const user = await requireUser();
    const all = listCategories(user.id, { includeArchived: true });
    const active = all.filter((c) => !c.archivedAt);
    const archived = all.filter((c) => c.archivedAt);

    return (
        <>
            <PageHeader title="Categories" subtitle="Group income and expenses to see where money comes from and goes." />
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr_320px]">
                <CategoryList title="Expenses" items={active.filter((c) => c.kind === 'expense')} />
                <CategoryList title="Income" items={active.filter((c) => c.kind === 'income')} />
                <div className="space-y-6">
                    <Card>
                        <CardTitle>New category</CardTitle>
                        <ActionForm action={createCategory} className="space-y-4">
                            <Select
                                label="Type"
                                name="kind"
                                defaultValue="expense"
                                options={[
                                    { value: 'expense', label: 'Expense' },
                                    { value: 'income', label: 'Income' },
                                ]}
                            />
                            <Input label="Name" name="name" placeholder="e.g. Groceries" maxLength={60} required />
                            <Input label="Colour" name="color" type="color" defaultValue="#4C6FFF" inputClassName="!p-1" />
                            <SubmitButton className="w-full text-sm">Add category</SubmitButton>
                        </ActionForm>
                    </Card>
                    {archived.length > 0 && (
                        <Card>
                            <CardTitle>Archived</CardTitle>
                            <ul className="space-y-2">
                                {archived.map((c) => (
                                    <li key={c.id} className="flex items-center justify-between text-body-2">
                                        <span>
                                            {c.name} <span className="text-caption text-body-muted">({c.kind})</span>
                                        </span>
                                        <form action={restoreCategory.bind(null, c.id)}>
                                            <button type="submit" className="text-sm font-semibold text-brand">
                                                Restore
                                            </button>
                                        </form>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}
