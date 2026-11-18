/**
 * Declarative description of a "record" module (goals, projects, notes, ...).
 * One definition drives validation, forms, list cards and detail pages.
 * Must stay serialisable: it is shared by server and client code.
 */

export type FieldType =
    | 'text'
    | 'textarea'
    | 'url'
    | 'email'
    | 'date'
    | 'datetime'
    | 'select'
    | 'currency'
    | 'money'
    | 'account'
    | 'category'
    | 'employer'
    | 'person'
    | 'checkbox';

export type Option = { value: string; label: string };

export type FieldDef = {
    /** Column key on the Drizzle table (money fields use the `*Minor` column). */
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    options?: Option[];
    /** For money fields: the field holding the currency. */
    currencyField?: string;
    placeholder?: string;
    /** Initial value on create forms. */
    defaultValue?: string;
    help?: string;
    max?: number;
    /** Span the full form width. */
    full?: boolean;
    /** Show on list cards. */
    summary?: boolean;
    /** Form-only input (e.g. an option at creation); never stored or exported. */
    virtual?: boolean;
    /** Only shown when creating a record. */
    createOnly?: boolean;
};

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export type StatusDef = { value: string; label: string; tone: Tone };

export type ModuleGroup = 'money' | 'growth' | 'life' | 'time';

export type ModuleKey =
    | 'subscriptions'
    | 'goals'
    | 'savings'
    | 'debts'
    | 'investments'
    | 'wishlist'
    | 'plans'
    | 'projects'
    | 'learning'
    | 'career'
    | 'branding'
    | 'notes'
    | 'memories'
    | 'people'
    | 'responsibilities'
    | 'work'
    | 'reminders'
    | 'schedules';

export type ModuleDef = {
    key: ModuleKey;
    title: string;
    singular: string;
    description: string;
    group: ModuleGroup;
    icon: string;
    /** Field used as the record's heading. */
    titleField: 'title' | 'name';
    fields: FieldDef[];
    statuses?: StatusDef[];
    defaultStatus?: string;
    /** Enables the progress log on the detail page. */
    timeline?: { label: string; placeholder: string };
    /** Default ordering for lists. */
    sort?: { field: string; dir: 'asc' | 'desc' };
    /** Module-specific behaviour on the detail page. */
    extension?: 'goal' | 'subscription' | 'debt' | 'schedule' | 'employer' | 'person';
};
