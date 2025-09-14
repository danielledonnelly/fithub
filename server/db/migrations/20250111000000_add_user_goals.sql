-- migrate:up

-- Add goal columns to users table
ALTER TABLE `users` 
ADD COLUMN `daily_goal` int(11) DEFAULT 10000,
ADD COLUMN `weekly_goal` int(11) DEFAULT 70000,
ADD COLUMN `monthly_goal` int(11) DEFAULT 280000;

-- migrate:down

-- Remove goal columns from users table
ALTER TABLE `users` 
DROP COLUMN `daily_goal`,
DROP COLUMN `weekly_goal`,
DROP COLUMN `monthly_goal`;
