ALTER TABLE `users` ADD `training_reminders` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `training_reminder_time` text DEFAULT '08:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `training_reminder_prompt_seen` integer DEFAULT 0 NOT NULL;