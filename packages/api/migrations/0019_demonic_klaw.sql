CREATE TABLE `gyms` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`scale` text DEFAULT 'v' NOT NULL,
	`circuits_json` text NOT NULL,
	`walls_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_gyms_user` ON `gyms` (`user_id`);--> statement-breakpoint
ALTER TABLE `sessions` ADD `gym_id` text;