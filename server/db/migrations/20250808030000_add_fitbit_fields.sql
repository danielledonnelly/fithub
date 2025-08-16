-- migrate:up

-- Add Fitbit OAuth fields to users table
ALTER TABLE users 
ADD COLUMN fitbit_access_token TEXT NULL,
ADD COLUMN fitbit_refresh_token TEXT NULL,
ADD COLUMN fitbit_token_expiry TIMESTAMP NULL,
ADD COLUMN fitbit_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN fitbit_connected_at TIMESTAMP NULL,
ADD COLUMN fitbit_last_sync TIMESTAMP NULL;

-- Add index for better performance
CREATE INDEX idx_users_fitbit_connected ON users(fitbit_connected);

-- migrate:down

-- Remove Fitbit OAuth fields from users table
DROP INDEX IF EXISTS idx_users_fitbit_connected ON users;

ALTER TABLE users 
DROP COLUMN IF EXISTS fitbit_access_token,
DROP COLUMN IF EXISTS fitbit_refresh_token,
DROP COLUMN IF EXISTS fitbit_token_expiry,
DROP COLUMN IF EXISTS fitbit_connected,
DROP COLUMN IF EXISTS fitbit_connected_at,
DROP COLUMN IF EXISTS fitbit_last_sync;
