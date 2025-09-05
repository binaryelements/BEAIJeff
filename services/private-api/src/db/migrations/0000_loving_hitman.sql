CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`key` varchar(255) NOT NULL,
	`name` varchar(100),
	`permissions` json DEFAULT ('[]'),
	`last_used_at` datetime,
	`expires_at` datetime,
	`is_active` boolean DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_key_unique` UNIQUE(`key`),
	CONSTRAINT `key_idx` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`action` varchar(100) NOT NULL,
	`resource` varchar(100),
	`resource_id` varchar(100),
	`ip_address` varchar(45),
	`user_agent` text,
	`metadata` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`call_id` int NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`event_data` json,
	`timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `call_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_transcripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`call_id` int NOT NULL,
	`role` varchar(20) NOT NULL,
	`text` text NOT NULL,
	`timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`metadata` json,
	CONSTRAINT `call_transcripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `callback_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`call_id` int,
	`callback_id` varchar(100) NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`preferred_time` varchar(100),
	`topic` text,
	`status` varchar(50) DEFAULT 'pending',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`scheduled_for` datetime,
	`completed_at` datetime,
	CONSTRAINT `callback_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `callback_schedules_callback_id_unique` UNIQUE(`callback_id`),
	CONSTRAINT `callback_id_idx` UNIQUE(`callback_id`)
);
--> statement-breakpoint
CREATE TABLE `calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_id` int,
	`phone_number_id` int,
	`contact_id` int,
	`call_sid` varchar(255) NOT NULL,
	`phone_number` varchar(20),
	`called_number` varchar(20),
	`status` varchar(50) DEFAULT 'in_progress',
	`department` varchar(50),
	`transfer_reason` text,
	`resolution` text,
	`customer_satisfied` boolean,
	`conversation_summary` text,
	`collected_data` json,
	`metadata` json,
	`started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`ended_at` datetime,
	`duration` int,
	CONSTRAINT `calls_id` PRIMARY KEY(`id`),
	CONSTRAINT `calls_call_sid_unique` UNIQUE(`call_sid`),
	CONSTRAINT `call_sid_idx` UNIQUE(`call_sid`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`email` varchar(255),
	`support_phone` varchar(20),
	`settings` json,
	`data_collection_fields` json DEFAULT ('{"standardFields":{"contactNumber":true,"companyName":true,"callerName":true,"reasonForCalling":true},"customFields":[]}'),
	`is_active` boolean DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `company_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`email` varchar(255),
	`company_name` varchar(255),
	`department` varchar(100),
	`role` varchar(100),
	`preferred_contact_method` varchar(50),
	`notes` text,
	`tags` json DEFAULT ('[]'),
	`custom_fields` json DEFAULT ('{}'),
	`last_contacted_at` datetime,
	`total_calls` int DEFAULT 0,
	`average_call_duration` int DEFAULT 0,
	`is_vip` boolean DEFAULT false,
	`is_blocked` boolean DEFAULT false,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_phone_idx` UNIQUE(`company_id`,`phone_number`)
);
--> statement-breakpoint
CREATE TABLE `phone_numbers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_id` int NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`display_name` varchar(100),
	`type` varchar(50) DEFAULT 'main',
	`instructions` text,
	`support_number` varchar(20),
	`metadata` json,
	`is_active` boolean DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `phone_numbers_id` PRIMARY KEY(`id`),
	CONSTRAINT `phone_numbers_phone_number_unique` UNIQUE(`phone_number`),
	CONSTRAINT `phone_number_idx` UNIQUE(`phone_number`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_id` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`first_name` varchar(100),
	`last_name` varchar(100),
	`phone_number` varchar(20),
	`role` varchar(50) DEFAULT 'user',
	`is_active` boolean DEFAULT true,
	`metadata` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `email_idx` UNIQUE(`email`),
	CONSTRAINT `username_idx` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_events` ADD CONSTRAINT `call_events_call_id_calls_id_fk` FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_transcripts` ADD CONSTRAINT `call_transcripts_call_id_calls_id_fk` FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `callback_schedules` ADD CONSTRAINT `callback_schedules_call_id_calls_id_fk` FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calls` ADD CONSTRAINT `calls_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calls` ADD CONSTRAINT `calls_phone_number_id_phone_numbers_id_fk` FOREIGN KEY (`phone_number_id`) REFERENCES `phone_numbers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calls` ADD CONSTRAINT `calls_contact_id_contacts_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `phone_numbers` ADD CONSTRAINT `phone_numbers_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_idx` ON `api_keys` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_user_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `event_call_idx` ON `call_events` (`call_id`);--> statement-breakpoint
CREATE INDEX `event_type_idx` ON `call_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `event_timestamp_idx` ON `call_events` (`timestamp`);--> statement-breakpoint
CREATE INDEX `transcript_call_idx` ON `call_transcripts` (`call_id`);--> statement-breakpoint
CREATE INDEX `transcript_timestamp_idx` ON `call_transcripts` (`timestamp`);--> statement-breakpoint
CREATE INDEX `callback_status_idx` ON `callback_schedules` (`status`);--> statement-breakpoint
CREATE INDEX `scheduled_for_idx` ON `callback_schedules` (`scheduled_for`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `calls` (`status`);--> statement-breakpoint
CREATE INDEX `started_at_idx` ON `calls` (`started_at`);--> statement-breakpoint
CREATE INDEX `call_company_idx` ON `calls` (`company_id`);--> statement-breakpoint
CREATE INDEX `call_phone_number_idx` ON `calls` (`phone_number_id`);--> statement-breakpoint
CREATE INDEX `call_contact_idx` ON `calls` (`contact_id`);--> statement-breakpoint
CREATE INDEX `contact_company_idx` ON `contacts` (`company_id`);--> statement-breakpoint
CREATE INDEX `contact_phone_idx` ON `contacts` (`phone_number`);--> statement-breakpoint
CREATE INDEX `contact_email_idx` ON `contacts` (`email`);--> statement-breakpoint
CREATE INDEX `contact_name_idx` ON `contacts` (`name`);--> statement-breakpoint
CREATE INDEX `phone_company_idx` ON `phone_numbers` (`company_id`);--> statement-breakpoint
CREATE INDEX `company_idx` ON `users` (`company_id`);