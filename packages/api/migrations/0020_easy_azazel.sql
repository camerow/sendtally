CREATE TABLE `area_climbs` (
	`id` text PRIMARY KEY NOT NULL,
	`area_id` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`grade_scale` text NOT NULL,
	`grade_value` text,
	`length_m` integer,
	`bolts` integer,
	`first_ascent` text,
	`status` text NOT NULL,
	`merged_into_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `area_climbs_slug_unique` ON `area_climbs` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_area_climbs_area` ON `area_climbs` (`area_id`);--> statement-breakpoint
CREATE INDEX `idx_area_climbs_name_key` ON `area_climbs` (`name_key`);--> statement-breakpoint
CREATE INDEX `idx_area_climbs_status` ON `area_climbs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_area_climbs_merged_into` ON `area_climbs` (`merged_into_id`);--> statement-breakpoint
CREATE TABLE `areas` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`path` text NOT NULL,
	`depth` integer NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`lat` real,
	`lon` real,
	`region_code` text,
	`status` text NOT NULL,
	`merged_into_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `areas_slug_unique` ON `areas` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `areas_region_code_unique` ON `areas` (`region_code`);--> statement-breakpoint
CREATE INDEX `idx_areas_parent` ON `areas` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_areas_path` ON `areas` (`path`);--> statement-breakpoint
CREATE INDEX `idx_areas_name_key` ON `areas` (`name_key`);--> statement-breakpoint
CREATE INDEX `idx_areas_status` ON `areas` (`status`);--> statement-breakpoint
CREATE INDEX `idx_areas_lat` ON `areas` (`lat`);--> statement-breakpoint
CREATE TABLE `content_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`reporter_id` text,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_content_reports_status` ON `content_reports` (`status`);--> statement-breakpoint
CREATE TABLE `content_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`proposed_json` text NOT NULL,
	`base_json` text NOT NULL,
	`change_summary` text,
	`status` text NOT NULL,
	`submitted_by` text,
	`reviewed_by` text,
	`review_note` text,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_content_revisions_entity` ON `content_revisions` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_content_revisions_status` ON `content_revisions` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_content_revisions_one_draft` ON `content_revisions` (`submitted_by`,`entity_type`,`entity_id`) WHERE "content_revisions"."status" = 'pending';--> statement-breakpoint
CREATE TABLE `duplicate_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`keep_climb_id` text NOT NULL,
	`duplicate_climb_id` text NOT NULL,
	`reporter_id` text,
	`note` text,
	`status` text NOT NULL,
	`reviewed_by` text,
	`review_note` text,
	`created_at` text NOT NULL,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_duplicate_reports_status` ON `duplicate_reports` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_duplicate_reports_open` ON `duplicate_reports` (`duplicate_climb_id`,`reporter_id`) WHERE "duplicate_reports"."status" = 'open';--> statement-breakpoint
CREATE TABLE `session_climb_links` (
	`user_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`climb_slug` text NOT NULL,
	`climb_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `fingerprint`, `climb_slug`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_session_climb_links_climb` ON `session_climb_links` (`climb_id`);--> statement-breakpoint
ALTER TABLE `sessions` ADD `area_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'user' NOT NULL;