CREATE TABLE `climb_notes` (
	`user_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`climb_slug` text NOT NULL,
	`note` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `fingerprint`, `climb_slug`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_climb_notes_user_climb` ON `climb_notes` (`user_id`,`climb_slug`);