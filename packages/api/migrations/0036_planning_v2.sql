CREATE TABLE `memberships` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`workout_id` text NOT NULL,
	`block_id` text,
	`weekdays_json` text NOT NULL,
	`start` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `week_changes` (
	`user_id` text NOT NULL,
	`membership_id` text NOT NULL,
	`week` integer NOT NULL,
	`variation` integer NOT NULL,
	`item` integer NOT NULL,
	`change_json` text NOT NULL,
	PRIMARY KEY(`user_id`, `membership_id`, `week`, `variation`, `item`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `activities` ADD `membership_id` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `week` integer;--> statement-breakpoint
ALTER TABLE `activities` ADD `variation` integer;--> statement-breakpoint
ALTER TABLE `activities` ADD `done_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `hang_sessions` ADD `membership_id` text;--> statement-breakpoint
ALTER TABLE `hang_sessions` ADD `week` integer;--> statement-breakpoint
ALTER TABLE `hang_sessions` ADD `variation` integer;--> statement-breakpoint
ALTER TABLE `hang_sessions` ADD `done_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `membership_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `week` integer;--> statement-breakpoint
ALTER TABLE `sessions` ADD `variation` integer;--> statement-breakpoint
ALTER TABLE `workouts` ADD `kind` text DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE `workouts` ADD `variations_json` text DEFAULT '[{"label":"","items":[]}]' NOT NULL;--> statement-breakpoint
ALTER TABLE `workouts` ADD `pattern_json` text DEFAULT '[0]' NOT NULL;