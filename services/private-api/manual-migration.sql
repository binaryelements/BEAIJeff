-- Check and add data_collection_fields column to companies table if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'companies';
SET @columnname = 'data_collection_fields';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " json DEFAULT ('{\"standardFields\":{\"contactNumber\":true,\"companyName\":true,\"callerName\":true,\"reasonForCalling\":true},\"customFields\":[]}');")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Create contacts table if not exists
CREATE TABLE IF NOT EXISTS `contacts` (
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
	CONSTRAINT `company_phone_idx` UNIQUE(`company_id`,`phone_number`),
	CONSTRAINT `contacts_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action,
	INDEX `contact_company_idx` (`company_id`),
	INDEX `contact_phone_idx` (`phone_number`),
	INDEX `contact_email_idx` (`email`),
	INDEX `contact_name_idx` (`name`)
);

-- Check and add contact_id column to calls table if it doesn't exist
SET @columnname = 'contact_id';
SET @tablename = 'calls';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " int;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add collected_data column to calls table if it doesn't exist
SET @columnname = 'collected_data';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " json;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add foreign key for contact_id if contacts table exists and constraint doesn't exist
SET @constraint_name = 'calls_contact_id_contacts_id_fk';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      CONSTRAINT_SCHEMA = @dbname
      AND TABLE_NAME = 'calls'
      AND CONSTRAINT_NAME = @constraint_name
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `calls` ADD CONSTRAINT `calls_contact_id_contacts_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add index for contact_id if it doesn't exist
SET @index_name = 'call_contact_idx';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'calls'
      AND INDEX_NAME = @index_name
  ) > 0,
  "SELECT 1",
  "CREATE INDEX `call_contact_idx` ON `calls` (`contact_id`);"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;