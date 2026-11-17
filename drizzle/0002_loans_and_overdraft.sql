ALTER TABLE `accounts` ADD `overdraft_limit_minor` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `debts` ADD `principal_minor` integer;--> statement-breakpoint
ALTER TABLE `debts` ADD `upfront_fee_minor` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `debts` ADD `started_on` text;--> statement-breakpoint
ALTER TABLE `debts` ADD `settled_by` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `debt_id` text REFERENCES debts(id) ON DELETE set null;--> statement-breakpoint
ALTER TABLE `transactions` ADD `debt_role` text;--> statement-breakpoint
CREATE INDEX `transactions_debt_idx` ON `transactions` (`debt_id`);