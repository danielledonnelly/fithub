-- migrate:up

-- Remove the old steps column since we now use inputted_steps and fitbit_steps
ALTER TABLE `steps` DROP COLUMN `steps`;

-- migrate:down

-- Add back the steps column and populate it with the sum of inputted_steps and fitbit_steps
ALTER TABLE `steps` 
ADD COLUMN `steps` int(11) NOT NULL DEFAULT 0 AFTER `date`;

-- Populate the steps column with the sum of inputted_steps and fitbit_steps
UPDATE `steps` SET `steps` = COALESCE(`inputted_steps`, 0) + COALESCE(`fitbit_steps`, 0);
