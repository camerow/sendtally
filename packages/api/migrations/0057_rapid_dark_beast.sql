CREATE TABLE `membership_days` (
	`user_id` text NOT NULL,
	`membership_id` text NOT NULL,
	`from_week` integer NOT NULL,
	`weekdays_json` text NOT NULL,
	PRIMARY KEY(`user_id`, `membership_id`, `from_week`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
