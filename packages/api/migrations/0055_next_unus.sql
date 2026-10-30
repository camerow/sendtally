PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_training_blocks` (
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
INSERT INTO `__new_training_blocks`("user_id", "id", "name", "start", "weeks", "focus", "updated_at") SELECT "user_id", "id", "name", "start", "weeks", "focus", "updated_at" FROM `training_blocks`;--> statement-breakpoint
DROP TABLE `training_blocks`;--> statement-breakpoint
ALTER TABLE `__new_training_blocks` RENAME TO `training_blocks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;