CREATE TABLE `exercises` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_exercises_user_name` ON `exercises` (`user_id`,`name_key`);