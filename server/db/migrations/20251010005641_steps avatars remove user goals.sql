-- migrate:up

-- Add separate columns for inputted steps and fitbit steps
ALTER TABLE `steps` 
ADD COLUMN `inputted_steps` int(11) NOT NULL DEFAULT 0 AFTER `steps`,
ADD COLUMN `fitbit_steps` int(11) NOT NULL DEFAULT 0 AFTER `inputted_steps`;

-- Migrate existing data: move current steps to inputted_steps
UPDATE `steps` SET `inputted_steps` = `steps` WHERE `steps` > 0;

-- Fix avatar column to support longer URLs
ALTER TABLE users MODIFY COLUMN avatar TEXT;

-- Remove the old steps column since we now use inputted_steps and fitbit_steps
ALTER TABLE `steps` DROP COLUMN `steps`;


ALTER TABLE `users` MODIFY COLUMN `avatar` TEXT;

ALTER TABLE `users` 
ADD COLUMN `daily_goal` int(11) DEFAULT 10000,
ADD COLUMN `weekly_goal` int(11) DEFAULT 70000,
ADD COLUMN `monthly_goal` int(11) DEFAULT 280000;

-- migrate:down

-- Remove the separate columns
ALTER TABLE `steps` 
DROP COLUMN `inputted_steps`,
DROP COLUMN `fitbit_steps`;

-- Revert avatar column back to varchar(10)
ALTER TABLE users MODIFY COLUMN avatar VARCHAR(10) DEFAULT NULL;

-- Add back the steps column and populate it with the sum of inputted_steps and fitbit_steps
ALTER TABLE `steps` 
ADD COLUMN `steps` int(11) NOT NULL DEFAULT 0 AFTER `date`;

-- Populate the steps column with the sum of inputted_steps and fitbit_steps
UPDATE `steps` SET `steps` = COALESCE(`inputted_steps`, 0) + COALESCE(`fitbit_steps`, 0);


ALTER TABLE `users` MODIFY COLUMN `avatar` VARCHAR(10);

-- Remove goal columns from users table
ALTER TABLE `users` 
DROP COLUMN `daily_goal`,
DROP COLUMN `weekly_goal`,
DROP COLUMN `monthly_goal`;