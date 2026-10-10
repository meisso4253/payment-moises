CREATE TABLE `grants` (
	`payment_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`reference` text NOT NULL,
	`amount` integer NOT NULL,
	`duration` integer NOT NULL,
	`paid_at` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text NOT NULL,
	`proof_key` text NOT NULL,
	`proof_type` text NOT NULL,
	`proof_name` text NOT NULL,
	`recipient_name` text NOT NULL,
	`recipient_number` text NOT NULL,
	`reviewed_at` integer,
	`reviewed_by` text,
	`review_note` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_reference_unique` ON `payments` (`reference`);--> statement-breakpoint
CREATE TABLE `planners` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer NOT NULL
);
