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
CREATE TABLE `hang_schedules` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`workout_id` text NOT NULL,
	`grip_id` text NOT NULL,
	`days_json` text NOT NULL,
	`start` text NOT NULL,
	`end` text,
	`skip_json` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hang_sessions` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`workout_id` text NOT NULL,
	`grip_id` text NOT NULL,
	`date` text NOT NULL,
	`load_kg` real NOT NULL,
	`pct` integer NOT NULL,
	`misses` integer NOT NULL,
	`rpe` integer,
	`protocol_json` text NOT NULL,
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
CREATE TABLE `hang_workouts` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`grip` text NOT NULL,
	`edge_mm` integer NOT NULL,
	`hang_s` integer NOT NULL,
	`rest_s` integer NOT NULL,
	`reps` integer NOT NULL,
	`sets` integer NOT NULL,
	`set_rest_s` integer NOT NULL,
	`time_units_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
