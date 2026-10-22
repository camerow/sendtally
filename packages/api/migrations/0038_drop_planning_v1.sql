DROP TABLE `hang_schedules`;--> statement-breakpoint
DROP TABLE `hang_workouts`;--> statement-breakpoint
DROP TABLE `plan_items`;--> statement-breakpoint
ALTER TABLE `activities` DROP COLUMN `plan_item_id`;--> statement-breakpoint
ALTER TABLE `activities` DROP COLUMN `detail_kind`;--> statement-breakpoint
ALTER TABLE `activities` DROP COLUMN `detail_json`;--> statement-breakpoint
ALTER TABLE `training_blocks` DROP COLUMN `phases_json`;--> statement-breakpoint
ALTER TABLE `training_blocks` DROP COLUMN `notes`;--> statement-breakpoint
ALTER TABLE `training_blocks` DROP COLUMN `ended_on`;--> statement-breakpoint
ALTER TABLE `workouts` DROP COLUMN `category`;--> statement-breakpoint
ALTER TABLE `workouts` DROP COLUMN `tags_json`;--> statement-breakpoint
ALTER TABLE `workouts` DROP COLUMN `body_kind`;--> statement-breakpoint
ALTER TABLE `workouts` DROP COLUMN `body_json`;