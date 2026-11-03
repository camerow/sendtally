CREATE TABLE `week_changes` (
	`user_id` text NOT NULL,
	`membership_id` text NOT NULL,
	`week` integer NOT NULL,
	`variation` integer NOT NULL,
	`item` integer NOT NULL,
	`change_json` text NOT NULL,
	PRIMARY KEY(`user_id`, `membership_id`, `week`, `variation`, `item`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
