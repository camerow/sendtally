CREATE TABLE `item_week_changes` (
	`user_id` text NOT NULL,
	`membership_id` text NOT NULL,
	`week` integer NOT NULL,
	`dose` integer NOT NULL,
	`item_id` text NOT NULL,
	`change_json` text NOT NULL,
	PRIMARY KEY(`user_id`, `membership_id`, `week`, `dose`, `item_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
