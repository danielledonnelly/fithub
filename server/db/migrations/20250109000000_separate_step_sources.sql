-- migrate:up

-- Add separate columns for inputted steps and fitbit steps
ALTER TABLE `steps` 
ADD COLUMN `inputted_steps` int(11) NOT NULL DEFAULT 0 AFTER `steps`,
ADD COLUMN `fitbit_steps` int(11) NOT NULL DEFAULT 0 AFTER `inputted_steps`;

-- Migrate existing data: move current steps to inputted_steps
UPDATE `steps` SET `inputted_steps` = `steps` WHERE `steps` > 0;

-- migrate:down

-- Remove the separate columns
ALTER TABLE `steps` 
DROP COLUMN `inputted_steps`,
DROP COLUMN `fitbit_steps`;
