CREATE TABLE `library_media` (
	`id` text PRIMARY KEY NOT NULL,
	`item_type` text NOT NULL,
	`item_id` text NOT NULL,
	`key` text NOT NULL,
	`thumb_key` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`bytes` integer NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`credit` text DEFAULT '' NOT NULL,
	`position` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_library_media_item` ON `library_media` (`item_type`,`item_id`,`position`);