ALTER TABLE `hang_sessions` ADD `activity_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_hang_sessions_user_activity` ON `hang_sessions` (`user_id`,`activity_id`);