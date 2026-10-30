CREATE TABLE `training_blocks` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`start` text NOT NULL,
	`weeks` integer NOT NULL,
	`phases_json` text NOT NULL,
	`notes` text,
	`ended_on` text,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `hang_schedules` ADD `target_rpe` integer;--> statement-breakpoint
ALTER TABLE `hang_schedules` ADD `block_id` text;--> statement-breakpoint
ALTER TABLE `plan_items` ADD `block_id` text;