ALTER TABLE `activities` ADD `strava_activity_id` integer;--> statement-breakpoint
ALTER TABLE `activities` ADD `posted_at` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `post_state` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `post_error` text;--> statement-breakpoint
ALTER TABLE `strava_connections` ADD `post_training` integer DEFAULT false NOT NULL;