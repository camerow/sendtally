ALTER TABLE `exercises` ADD `measure` text DEFAULT 'reps' NOT NULL;--> statement-breakpoint
ALTER TABLE `exercises` ADD `each_side` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `exercises` ADD `built_in` text;--> statement-breakpoint
ALTER TABLE `exercises` ADD `archived` integer DEFAULT false NOT NULL;