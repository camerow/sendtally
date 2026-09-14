CREATE TABLE `entry_tags` (
	`user_id` text NOT NULL,
	`entry_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `entry_id`, `tag_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_entry_tags_user_tag` ON `entry_tags` (`user_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`kind` text NOT NULL,
	`occurred_at` text NOT NULL,
	`ends_at` text,
	`title` text,
	`body` text NOT NULL,
	`fingerprint` text,
	`parent_id` text,
	`severity` integer,
	`status` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_entries_user_occurred` ON `journal_entries` (`user_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_entries_user_fingerprint` ON `journal_entries` (`user_id`,`fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_entries_user_parent` ON `journal_entries` (`user_id`,`parent_id`);