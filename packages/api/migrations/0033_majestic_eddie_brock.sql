CREATE TABLE `workouts` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`tags_json` text NOT NULL,
	`minutes` integer,
	`target_rpe` integer,
	`body_kind` text,
	`body_json` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `activities` ADD `workout_id` text;--> statement-breakpoint
ALTER TABLE `plan_items` ADD `workout_id` text;