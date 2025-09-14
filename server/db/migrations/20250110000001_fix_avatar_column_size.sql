-- migrate:up
ALTER TABLE `users` MODIFY COLUMN `avatar` TEXT;

-- migrate:down
ALTER TABLE `users` MODIFY COLUMN `avatar` VARCHAR(10);
