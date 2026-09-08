CREATE TABLE `session_tags` (
	`user_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `fingerprint`, `tag_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_session_tags_user_tag` ON `session_tags` (`user_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tags_user_slug` ON `tags` (`user_id`,`slug`);