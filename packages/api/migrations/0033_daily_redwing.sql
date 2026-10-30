ALTER TABLE `hang_schedules` ADD `edge_mm` integer;--> statement-breakpoint
ALTER TABLE `hang_schedules` ADD `load_kg` real;--> statement-breakpoint
ALTER TABLE `hang_sessions` ADD `edge_mm` integer DEFAULT 0 NOT NULL;