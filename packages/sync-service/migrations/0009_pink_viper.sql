CREATE TABLE `store_entitlements` (
	`user_id` text NOT NULL,
	`entitlement` text NOT NULL,
	`store` text NOT NULL,
	`product_id` text NOT NULL,
	`expires_at` text,
	`will_renew` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `entitlement`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
