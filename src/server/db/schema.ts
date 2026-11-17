/**
 * Database schema (SQLite via Drizzle).
 *
 * Conventions:
 * - Money is stored as integer minor units (e.g. cents) in `*_minor` columns,
 *   always alongside the ISO 4217 currency it is denominated in.
 * - Calendar dates (no time) are stored as `YYYY-MM-DD` text.
 * - Instants are stored as unix epoch milliseconds.
 * - Account balances are never stored; they are derived from the ledger.
 */
import {
    sqliteTable,
    text,
    integer,
    index,
    uniqueIndex,
    type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';

const id = () =>
    text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID());

const timestamps = {
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
        .notNull()
        .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
        .notNull()
        .$defaultFn(() => new Date())
        .$onUpdateFn(() => new Date()),
};

const userId = () =>
    text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' });

const metadata = () => text('metadata', { mode: 'json' }).$type<Record<string, unknown>>();

/** Optional cover/thumbnail image for an entity. */
const imageId = () =>
    text('image_id').references((): AnySQLiteColumn => files.id, { onDelete: 'set null' });

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const users = sqliteTable('users', {
    id: id(),
    firstName: text('first_name').notNull(),
    otherNames: text('other_names').notNull().default(''),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    /** AES-256-GCM encrypted base32 TOTP secret, null when 2FA is off. */
    totpSecret: text('totp_secret'),
    totpEnabled: integer('totp_enabled', { mode: 'boolean' }).notNull().default(false),
    /** Default currency for new accounts and summaries. */
    currency: text('currency').notNull().default('USD'),
    ...timestamps,
});

export const sessions = sqliteTable(
    'sessions',
    {
        /** SHA-256 of the session token; the raw token only lives in the cookie. */
        id: text('id').primaryKey(),
        userId: userId(),
        /** True until the second factor has been verified for this session. */
        pendingTotp: integer('pending_totp', { mode: 'boolean' }).notNull().default(false),
        userAgent: text('user_agent'),
        ip: text('ip'),
        expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
        createdAt: timestamps.createdAt,
    },
    (t) => [index('sessions_user_idx').on(t.userId)]
);

export const profiles = sqliteTable('profiles', {
    userId: text('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    avatarId: text('avatar_id').references((): AnySQLiteColumn => files.id, { onDelete: 'set null' }),
    coverId: text('cover_id').references((): AnySQLiteColumn => files.id, { onDelete: 'set null' }),
    dateOfBirth: text('date_of_birth'),
    gender: text('gender', { enum: ['male', 'female', 'intersex', 'nonconforming', 'other'] }),
    otherGender: text('other_gender'),
    placeOfBirth: text('place_of_birth'),
    nationality: text('nationality'),
    about: text('about'),
    funFacts: text('fun_facts'),
    metadata: metadata(),
    ...timestamps,
});

/** Audit trail of security-relevant events. Never store secrets here. */
export const activities = sqliteTable(
    'activities',
    {
        id: id(),
        userId: userId(),
        action: text('action').notNull(),
        description: text('description'),
        metadata: metadata(),
        createdAt: timestamps.createdAt,
    },
    (t) => [index('activities_user_idx').on(t.userId, t.createdAt)]
);

// ---------------------------------------------------------------------------
// Files & attachments
// ---------------------------------------------------------------------------

export const files = sqliteTable('files', {
    id: id(),
    userId: userId(),
    name: text('name').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    /** Path relative to the uploads directory. */
    path: text('path').notNull(),
    metadata: metadata(),
    createdAt: timestamps.createdAt,
});

/**
 * Links files to any entity. Replaces the per-table `files` columns and
 * the 25 back-relations the old `File` model carried.
 */
export const attachments = sqliteTable(
    'attachments',
    {
        id: id(),
        fileId: text('file_id')
            .notNull()
            .references(() => files.id, { onDelete: 'cascade' }),
        entityType: text('entity_type').notNull(),
        entityId: text('entity_id').notNull(),
        createdAt: timestamps.createdAt,
    },
    (t) => [index('attachments_entity_idx').on(t.entityType, t.entityId)]
);

/**
 * Progress log for any trackable entity (plans, projects, learning, career,
 * branding, ...). Replaces the separate `*Update` tables.
 */
export const timelineEntries = sqliteTable(
    'timeline_entries',
    {
        id: id(),
        userId: userId(),
        entityType: text('entity_type').notNull(),
        entityId: text('entity_id').notNull(),
        title: text('title').notNull(),
        body: text('body'),
        occurredAt: integer('occurred_at', { mode: 'timestamp_ms' })
            .notNull()
            .$defaultFn(() => new Date()),
        metadata: metadata(),
        ...timestamps,
    },
    (t) => [index('timeline_entity_idx').on(t.entityType, t.entityId, t.occurredAt)]
);

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export const ACCOUNT_TYPES = ['cash', 'card', 'mobile', 'bank'] as const;
export const FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const;

export const accounts = sqliteTable(
    'accounts',
    {
        id: id(),
        userId: userId(),
        name: text('name').notNull(),
        description: text('description'),
        type: text('type', { enum: ACCOUNT_TYPES }).notNull(),
        currency: text('currency').notNull(),
        openingBalanceMinor: integer('opening_balance_minor').notNull().default(0),
        /** How far below zero the balance may go (e.g. MoMo Boost). 0 = no overdraft. */
        overdraftLimitMinor: integer('overdraft_limit_minor').notNull().default(0),
        isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
        imageId: imageId(),
        archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
        metadata: metadata(),
        ...timestamps,
    },
    (t) => [index('accounts_user_idx').on(t.userId)]
);

export const categories = sqliteTable(
    'categories',
    {
        id: id(),
        userId: userId(),
        kind: text('kind', { enum: ['income', 'expense'] }).notNull(),
        name: text('name').notNull(),
        description: text('description'),
        color: text('color'),
        imageId: imageId(),
        archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
        ...timestamps,
    },
    (t) => [uniqueIndex('categories_user_kind_name_idx').on(t.userId, t.kind, t.name)]
);

export const transfers = sqliteTable('transfers', {
    id: id(),
    userId: userId(),
    fromAccountId: text('from_account_id')
        .notNull()
        .references(() => accounts.id, { onDelete: 'restrict' }),
    toAccountId: text('to_account_id')
        .notNull()
        .references(() => accounts.id, { onDelete: 'restrict' }),
    /** Amount debited from the source account (excluding fee). */
    fromAmountMinor: integer('from_amount_minor').notNull(),
    /** Amount credited to the destination (differs for cross-currency). */
    toAmountMinor: integer('to_amount_minor').notNull(),
    feeMinor: integer('fee_minor').notNull().default(0),
    title: text('title').notNull(),
    note: text('note'),
    occurredOn: text('occurred_on').notNull(),
    status: text('status', { enum: ['active', 'reversed'] }).notNull().default('active'),
    ...timestamps,
});

/**
 * The ledger. Every movement of money is one row, signed in the account's
 * currency (positive = money in, negative = money out). Replaces the old
 * Transaction + Expense + Income triple.
 */
export const transactions = sqliteTable(
    'transactions',
    {
        id: id(),
        userId: userId(),
        accountId: text('account_id')
            .notNull()
            .references(() => accounts.id, { onDelete: 'restrict' }),
        /** `debt` = money borrowed/lent or principal repaid; never counted as income or spending. */
        kind: text('kind', { enum: ['income', 'expense', 'transfer', 'adjustment', 'debt'] }).notNull(),
        amountMinor: integer('amount_minor').notNull(),
        categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
        transferId: text('transfer_id').references(() => transfers.id, { onDelete: 'cascade' }),
        subscriptionId: text('subscription_id').references((): AnySQLiteColumn => subscriptions.id, {
            onDelete: 'set null',
        }),
        debtId: text('debt_id').references((): AnySQLiteColumn => debts.id, { onDelete: 'set null' }),
        /**
         * Role of a loan-linked entry: `disbursement` (money borrowed/lent),
         * `fee` (deducted upfront), `repayment` (principal part), `interest`
         * (finance-charge part of a repayment).
         */
        debtRole: text('debt_role', { enum: ['disbursement', 'fee', 'repayment', 'interest'] }),
        title: text('title').notNull(),
        note: text('note'),
        occurredOn: text('occurred_on').notNull(),
        status: text('status', { enum: ['active', 'reversed'] }).notNull().default('active'),
        metadata: metadata(),
        ...timestamps,
    },
    (t) => [
        index('transactions_account_idx').on(t.accountId, t.status),
        index('transactions_user_date_idx').on(t.userId, t.occurredOn),
        index('transactions_category_idx').on(t.categoryId),
        index('transactions_debt_idx').on(t.debtId),
    ]
);

/** Recurring income or expense (subscriptions, salaries, rent, ...). */
export const subscriptions = sqliteTable('subscriptions', {
    id: id(),
    userId: userId(),
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    kind: text('kind', { enum: ['income', 'expense'] }).notNull().default('expense'),
    title: text('title').notNull(),
    description: text('description'),
    amountMinor: integer('amount_minor').notNull(),
    currency: text('currency').notNull(),
    frequency: text('frequency', { enum: FREQUENCIES }).notNull(),
    nextDueOn: text('next_due_on'),
    status: text('status', { enum: ['active', 'paused', 'cancelled'] }).notNull().default('active'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

export const goals = sqliteTable('goals', {
    id: id(),
    userId: userId(),
    title: text('title').notNull(),
    description: text('description'),
    targetMinor: integer('target_minor').notNull(),
    currency: text('currency').notNull(),
    contributionFrequency: text('contribution_frequency', { enum: [...FREQUENCIES, 'custom'] }),
    deadline: text('deadline'),
    status: text('status', { enum: ['active', 'paused', 'cancelled', 'completed'] })
        .notNull()
        .default('active'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

export const goalContributions = sqliteTable('goal_contributions', {
    id: id(),
    userId: userId(),
    goalId: text('goal_id')
        .notNull()
        .references(() => goals.id, { onDelete: 'cascade' }),
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    amountMinor: integer('amount_minor').notNull(),
    occurredOn: text('occurred_on').notNull(),
    note: text('note'),
    ...timestamps,
});

export const savingsPlans = sqliteTable('savings_plans', {
    id: id(),
    userId: userId(),
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    amountMinor: integer('amount_minor').notNull(),
    currency: text('currency').notNull(),
    frequency: text('frequency', { enum: FREQUENCIES }),
    startOn: text('start_on'),
    nextDueOn: text('next_due_on'),
    status: text('status', { enum: ['todo', 'active', 'paused', 'cancelled', 'completed'] })
        .notNull()
        .default('active'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

export const debts = sqliteTable('debts', {
    id: id(),
    userId: userId(),
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    /** `owed` = I owe someone; `lent` = someone owes me. */
    direction: text('direction', { enum: ['owed', 'lent'] }).notNull().default('owed'),
    counterparty: text('counterparty'),
    title: text('title').notNull(),
    description: text('description'),
    /** Total to repay (principal + finance charges). Outstanding = this − repaid. */
    amountMinor: integer('amount_minor').notNull(),
    /** Amount borrowed/lent before charges. Null = same as the total (no interest). */
    principalMinor: integer('principal_minor'),
    /** Fees deducted from the money received (e.g. a commitment fee). */
    upfrontFeeMinor: integer('upfront_fee_minor').notNull().default(0),
    currency: text('currency').notNull(),
    startedOn: text('started_on'),
    dueOn: text('due_on'),
    paidOn: text('paid_on'),
    status: text('status', { enum: ['active', 'cancelled', 'paid'] }).notNull().default('active'),
    /**
     * How a `paid` debt was settled: `ledger` = repayments cleared it (reopens if
     * one is removed); `manual` = marked settled by hand (never reopened). Null
     * for debts settled before this was tracked.
     */
    settledBy: text('settled_by', { enum: ['ledger', 'manual'] }),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

export const investments = sqliteTable('investments', {
    id: id(),
    userId: userId(),
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    type: text('type', { enum: ['stocks', 'bonds', 'cash_equivalent', 'others'] }).notNull(),
    otherType: text('other_type'),
    title: text('title').notNull(),
    description: text('description'),
    amountMinor: integer('amount_minor').notNull(),
    currency: text('currency').notNull(),
    startOn: text('start_on'),
    status: text('status', { enum: ['todo', 'active', 'paused', 'cancelled', 'completed'] })
        .notNull()
        .default('active'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

export const wishlistItems = sqliteTable('wishlist_items', {
    id: id(),
    userId: userId(),
    title: text('title').notNull(),
    description: text('description'),
    url: text('url'),
    amountMinor: integer('amount_minor'),
    currency: text('currency'),
    status: text('status', { enum: ['wanted', 'purchased', 'dropped'] }).notNull().default('wanted'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

// ---------------------------------------------------------------------------
// Work & growth
// ---------------------------------------------------------------------------

export const employers = sqliteTable('employers', {
    id: id(),
    userId: userId(),
    name: text('name').notNull(),
    employerType: text('employer_type', { enum: ['individual', 'company'] }).notNull(),
    employmentType: text('employment_type', { enum: ['contract', 'full_time', 'part_time'] }).notNull(),
    paymentType: text('payment_type', { enum: ['salary', 'wages', 'compensations'] }),
    paymentFrequency: text('payment_frequency', {
        enum: ['yearly', 'quarterly', 'monthly', 'weekly', 'hourly', 'milestone'],
    }),
    /** Account that receives payments from this employer. */
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    address: text('address'),
    startOn: text('start_on'),
    endOn: text('end_on'),
    status: text('status', { enum: ['todo', 'active', 'paused', 'terminated', 'completed'] })
        .notNull()
        .default('active'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

export const employerContacts = sqliteTable('employer_contacts', {
    id: id(),
    userId: userId(),
    employerId: text('employer_id')
        .notNull()
        .references(() => employers.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['email', 'phone', 'link', 'address', 'other'] }).notNull(),
    label: text('label').notNull(),
    value: text('value').notNull(),
    ...timestamps,
});

export const projects = sqliteTable('projects', {
    id: id(),
    userId: userId(),
    employerId: text('employer_id').references(() => employers.id, { onDelete: 'set null' }),
    type: text('type', { enum: ['personal', 'employer'] }).notNull().default('personal'),
    title: text('title').notNull(),
    description: text('description'),
    budgetMinor: integer('budget_minor'),
    incomeMinor: integer('income_minor'),
    currency: text('currency'),
    startOn: text('start_on'),
    dueOn: text('due_on'),
    completedOn: text('completed_on'),
    status: text('status', {
        enum: ['todo', 'active', 'paused', 'completed', 'terminated', 'abandoned'],
    })
        .notNull()
        .default('todo'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

const PROGRESS_STATUSES = ['todo', 'progress', 'paused', 'completed', 'abandoned'] as const;

export const learnings = sqliteTable('learnings', {
    id: id(),
    userId: userId(),
    title: text('title').notNull(),
    description: text('description'),
    startOn: text('start_on'),
    dueOn: text('due_on'),
    completedOn: text('completed_on'),
    status: text('status', { enum: PROGRESS_STATUSES }).notNull().default('todo'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

export const brandingGoals = sqliteTable('branding_goals', {
    id: id(),
    userId: userId(),
    title: text('title').notNull(),
    description: text('description'),
    startOn: text('start_on'),
    dueOn: text('due_on'),
    completedOn: text('completed_on'),
    status: text('status', { enum: PROGRESS_STATUSES }).notNull().default('todo'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

export const careers = sqliteTable('careers', {
    id: id(),
    userId: userId(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', { enum: ['todo', 'active', 'paused', 'abandoned'] }).notNull().default('todo'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

export const futurePlans = sqliteTable('future_plans', {
    id: id(),
    userId: userId(),
    title: text('title').notNull(),
    description: text('description'),
    expectedOn: text('expected_on'),
    fulfilledOn: text('fulfilled_on'),
    status: text('status', { enum: ['todo', 'progress', 'paused', 'completed', 'failed', 'abandoned'] })
        .notNull()
        .default('todo'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

// ---------------------------------------------------------------------------
// Life
// ---------------------------------------------------------------------------

export const responsibilities = sqliteTable('responsibilities', {
    id: id(),
    userId: userId(),
    /** Free-text area of life, e.g. "Family", "Home", "Church". */
    area: text('area'),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', { enum: ['active', 'paused', 'terminated', 'completed'] })
        .notNull()
        .default('active'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

/** People in your life. Interactions are logged in `timeline_entries`. */
export const relationships = sqliteTable('relationships', {
    id: id(),
    userId: userId(),
    name: text('name').notNull(),
    kind: text('kind', { enum: ['family', 'partner', 'friend', 'colleague', 'mentor', 'other'] })
        .notNull()
        .default('friend'),
    birthday: text('birthday'),
    phone: text('phone'),
    email: text('email'),
    description: text('description'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

export const notes = sqliteTable('notes', {
    id: id(),
    userId: userId(),
    title: text('title').notNull(),
    content: text('content').notNull().default(''),
    pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
    metadata: metadata(),
    ...timestamps,
});

export const memories = sqliteTable('memories', {
    id: id(),
    userId: userId(),
    title: text('title').notNull(),
    description: text('description'),
    occurredOn: text('occurred_on'),
    coverId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

export const reminders = sqliteTable('reminders', {
    id: id(),
    userId: userId(),
    title: text('title').notNull(),
    description: text('description'),
    amountMinor: integer('amount_minor'),
    currency: text('currency'),
    frequency: text('frequency', { enum: ['never', 'daily', 'weekly', 'monthly', 'yearly'] })
        .notNull()
        .default('never'),
    /** Local date-time `YYYY-MM-DDTHH:mm` of the first occurrence. */
    startsAt: text('starts_at').notNull(),
    endsOn: text('ends_on'),
    status: text('status', { enum: ['active', 'paused', 'completed', 'cancelled'] })
        .notNull()
        .default('active'),
    metadata: metadata(),
    ...timestamps,
});

export const schedules = sqliteTable('schedules', {
    id: id(),
    userId: userId(),
    title: text('title').notNull(),
    description: text('description'),
    imageId: imageId(),
    metadata: metadata(),
    ...timestamps,
});

export const scheduleItems = sqliteTable('schedule_items', {
    id: id(),
    userId: userId(),
    scheduleId: text('schedule_id')
        .notNull()
        .references(() => schedules.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    frequency: text('frequency', {
        enum: [
            'never',
            'daily',
            'weekly',
            'weekdays',
            'weekends',
            'fortnightly',
            'monthly',
            'every3months',
            'every6months',
            'yearly',
            'custom',
        ],
    })
        .notNull()
        .default('never'),
    /** iCalendar RRULE for `custom` frequency. */
    rrule: text('rrule'),
    startsAt: text('starts_at').notNull(),
    endsOn: text('ends_on'),
    status: text('status', { enum: ['active', 'paused', 'completed', 'cancelled'] })
        .notNull()
        .default('active'),
    metadata: metadata(),
    ...timestamps,
});

export const notifications = sqliteTable(
    'notifications',
    {
        id: id(),
        userId: userId(),
        title: text('title').notNull(),
        body: text('body'),
        href: text('href'),
        /** Identifies the event (e.g. "/subscriptions/<id>@2026-12-01") so it notifies once. */
        key: text('key'),
        readAt: integer('read_at', { mode: 'timestamp_ms' }),
        createdAt: timestamps.createdAt,
    },
    (t) => [index('notifications_user_idx').on(t.userId, t.readAt), uniqueIndex('notifications_user_key_idx').on(t.userId, t.key)]
);

export const reports = sqliteTable('reports', {
    id: id(),
    userId: userId(),
    title: text('title').notNull(),
    description: text('description'),
    fileId: text('file_id').references(() => files.id, { onDelete: 'set null' }),
    metadata: metadata(),
    createdAt: timestamps.createdAt,
});

export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
