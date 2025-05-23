-- Add created_at timestamp column to soumissions table
ALTER TABLE app_schema.soumissions
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have a timestamp (use current time as fallback)
UPDATE app_schema.soumissions
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL;
