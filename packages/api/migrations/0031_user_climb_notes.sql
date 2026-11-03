CREATE TABLE `user_climb_notes` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`climb_id` text NOT NULL,
	`day` text NOT NULL,
	`note` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_user_climb_notes_climb` ON `user_climb_notes` (`user_id`,`climb_id`);