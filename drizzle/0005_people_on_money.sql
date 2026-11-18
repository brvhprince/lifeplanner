ALTER TABLE `debts` ADD `person_id` text REFERENCES relationships(id) ON DELETE set null;--> statement-breakpoint
ALTER TABLE `transactions` ADD `person_id` text REFERENCES relationships(id) ON DELETE set null;--> statement-breakpoint
CREATE INDEX `transactions_person_idx` ON `transactions` (`person_id`);