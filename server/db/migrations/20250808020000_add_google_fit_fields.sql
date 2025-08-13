-- Add Google Fit OAuth fields to users table
ALTER TABLE users 
ADD COLUMN google_fit_access_token TEXT NULL,
ADD COLUMN google_fit_refresh_token TEXT NULL,
ADD COLUMN google_fit_token_expiry BIGINT NULL,
ADD COLUMN google_fit_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN google_fit_connected_at TIMESTAMP NULL,
ADD COLUMN google_fit_last_sync TIMESTAMP NULL;

-- Add index for better performance
CREATE INDEX idx_users_google_fit_connected ON users(google_fit_connected);