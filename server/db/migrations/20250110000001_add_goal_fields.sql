-- migrate:up
ALTER TABLE users 
ADD COLUMN daily_goal INT DEFAULT 10000,
ADD COLUMN weekly_goal INT DEFAULT 70000;

-- migrate:down
ALTER TABLE users 
DROP COLUMN daily_goal,
DROP COLUMN weekly_goal;
