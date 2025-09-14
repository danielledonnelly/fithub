-- migrate:up

-- Fix avatar column to support longer URLs
ALTER TABLE users MODIFY COLUMN avatar TEXT;

-- migrate:down

-- Revert avatar column back to varchar(10)
ALTER TABLE users MODIFY COLUMN avatar VARCHAR(10) DEFAULT NULL;
