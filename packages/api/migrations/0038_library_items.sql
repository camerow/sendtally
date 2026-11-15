CREATE TABLE `library_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`item_type` text NOT NULL,
	`item_id` text NOT NULL,
	`changed_by` text NOT NULL,
	`changed_at` text NOT NULL,
	`before_json` text NOT NULL,
	`after_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_library_changes_item` ON `library_changes` (`item_type`,`item_id`,`changed_at`);--> statement-breakpoint
CREATE TABLE `library_items` (
	`type` text NOT NULL,
	`id` text NOT NULL,
	`position` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`translations` text DEFAULT '{}' NOT NULL,
	`spec` text DEFAULT '{}' NOT NULL,
	`updated_at` text,
	`updated_by` text,
	PRIMARY KEY(`type`, `id`)
);
