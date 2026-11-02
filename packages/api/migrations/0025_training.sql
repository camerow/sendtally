CREATE TABLE `activities` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text,
	`minutes` integer NOT NULL,
	`rpe` integer,
	`notes` text,
	`workout_id` text,
	`membership_id` text,
	`week` integer,
	`focus` text,
	`done_json` text DEFAULT '[]' NOT NULL,
	`strava_activity_id` integer,
	`posted_at` text,
	`post_state` text,
	`post_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_activities_user_date` ON `activities` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`kind` text NOT NULL,
	`measure` text DEFAULT 'reps' NOT NULL,
	`each_side` integer DEFAULT false NOT NULL,
	`progress` text,
	`built_in` text,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_exercises_user_name` ON `exercises` (`user_id`,`name_key`);--> statement-breakpoint
CREATE TABLE `hang_default_grips` (
	`user_id` text NOT NULL,
	`workout_id` text NOT NULL,
	`grip_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `workout_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hang_grips` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`measure` text DEFAULT 'hang' NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_hang_grips_user_name` ON `hang_grips` (`user_id`,`name_key`);--> statement-breakpoint
CREATE TABLE `hang_loads` (
	`user_id` text NOT NULL,
	`workout_id` text NOT NULL,
	`grip_id` text NOT NULL,
	`kg` real NOT NULL,
	PRIMARY KEY(`user_id`, `workout_id`, `grip_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hang_sessions` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`workout_id` text NOT NULL,
	`grip_id` text NOT NULL,
	`date` text NOT NULL,
	`edge_mm` integer DEFAULT 0 NOT NULL,
	`load_kg` real NOT NULL,
	`pct` integer NOT NULL,
	`misses` integer NOT NULL,
	`rpe` integer,
	`protocol_json` text NOT NULL,
	`membership_id` text,
	`week` integer,
	`focus` text,
	`done_json` text DEFAULT '[]' NOT NULL,
	`strava_activity_id` integer,
	`posted_at` text,
	`post_state` text,
	`post_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_hang_sessions_user_date` ON `hang_sessions` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `hang_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`units` text NOT NULL,
	`theme` text NOT NULL,
	`reminders` integer NOT NULL,
	`reminder_time` text NOT NULL,
	`post_to_strava` integer NOT NULL,
	`reminder_prompt_seen` integer NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `membership_days` (
	`user_id` text NOT NULL,
	`membership_id` text NOT NULL,
	`from_week` integer NOT NULL,
	`weekdays_json` text NOT NULL,
	PRIMARY KEY(`user_id`, `membership_id`, `from_week`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
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
CREATE TABLE `plan_changes` (
	`user_id` text NOT NULL,
	`membership_id` text NOT NULL,
	`planned_on` text NOT NULL,
	`kind` text NOT NULL,
	`moved_to` text,
	`reason` text,
	`note` text,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `membership_id`, `planned_on`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `training_blocks` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`start` text,
	`weeks` integer NOT NULL,
	`focus` text,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
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
CREATE TABLE `workouts` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`minutes` integer,
	`target_rpe` integer,
	`kind` text DEFAULT 'other' NOT NULL,
	`items_json` text DEFAULT '[]' NOT NULL,
	`exercise_rest_s` integer DEFAULT 180 NOT NULL,
	`focus` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD `send_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `membership_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `week` integer;--> statement-breakpoint
ALTER TABLE `sessions` ADD `focus` text;--> statement-breakpoint
ALTER TABLE `strava_connections` ADD `post_training` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `training_reminders` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `training_reminder_time` text DEFAULT '08:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `training_reminder_prompt_seen` integer DEFAULT 0 NOT NULL;