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
	`plan_item_id` text,
	`detail_kind` text,
	`detail_json` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_activities_user_date` ON `activities` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `plan_items` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`days_json` text NOT NULL,
	`per_week` integer,
	`start` text NOT NULL,
	`end` text,
	`skip_json` text NOT NULL,
	`minutes` integer,
	`target_rpe` integer,
	`project_id` text,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
