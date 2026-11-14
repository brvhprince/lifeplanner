ALTER TABLE `notifications` ADD `key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_user_key_idx` ON `notifications` (`user_id`,`key`);