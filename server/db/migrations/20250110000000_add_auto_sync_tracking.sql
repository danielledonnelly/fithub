-- migrate:up

-- Add auto-sync tracking fields to users table
ALTER TABLE users 
ADD COLUMN fitbit_auto_sync_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN fitbit_auto_sync_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN fitbit_auto_sync_last_attempt TIMESTAMP NULL,
ADD COLUMN fitbit_auto_sync_next_attempt TIMESTAMP NULL,
ADD COLUMN fitbit_auto_sync_failed_count INT DEFAULT 0;

-- Create index for efficient querying of auto-sync status
CREATE INDEX idx_users_auto_sync ON users(fitbit_auto_sync_enabled, fitbit_auto_sync_next_attempt);

-- migrate:down

-- Remove auto-sync tracking fields
DROP INDEX IF EXISTS idx_users_auto_sync ON users;

ALTER TABLE users 
DROP COLUMN IF EXISTS fitbit_auto_sync_enabled,
DROP COLUMN IF EXISTS fitbit_auto_sync_completed,
DROP COLUMN IF EXISTS fitbit_auto_sync_last_attempt,
DROP COLUMN IF EXISTS fitbit_auto_sync_next_attempt,
DROP COLUMN IF EXISTS fitbit_auto_sync_failed_count;
