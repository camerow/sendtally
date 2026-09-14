PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`user_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`grade_json` text,
	`discipline` text DEFAULT 'boulder' NOT NULL,
	`beta` text,
	`beta_updated_at` text,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `slug`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_projects`("user_id", "slug", "name", "grade_json", "discipline", "beta", "beta_updated_at", "created_at") SELECT "user_id", "slug", "name", "grade_json", "discipline", "beta", "beta_updated_at", "created_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;