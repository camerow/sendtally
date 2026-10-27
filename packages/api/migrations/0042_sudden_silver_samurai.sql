CREATE TABLE `user_climbs` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`discipline` text DEFAULT 'boulder' NOT NULL,
	`grade_json` text,
	`area_climb_id` text,
	`working` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_climbs_user_name` ON `user_climbs` (`user_id`,`name_key`);--> statement-breakpoint
ALTER TABLE `sessions` ADD `send_count` integer DEFAULT 0 NOT NULL;