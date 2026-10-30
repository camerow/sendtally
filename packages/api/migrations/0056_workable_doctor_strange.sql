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
