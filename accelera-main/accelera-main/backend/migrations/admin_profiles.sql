-- Create admin_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_schema.admin_profiles (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    nom VARCHAR(255),
    prenom VARCHAR(255),
    telephone VARCHAR(20),
    photo VARCHAR(255) DEFAULT '/default-avatar.jpg',
    biographie TEXT,
    accelerator_name VARCHAR(255),
    location VARCHAR(255),
    year_founded INTEGER,
    website VARCHAR(255),
    contact_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES app_schema.admin(id) ON DELETE CASCADE,
    UNIQUE(admin_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_profiles_admin_id ON app_schema.admin_profiles(admin_id);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION app_schema.update_admin_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_profile_timestamp ON app_schema.admin_profiles;
CREATE TRIGGER update_admin_profile_timestamp
BEFORE UPDATE ON app_schema.admin_profiles
FOR EACH ROW
EXECUTE FUNCTION app_schema.update_admin_profile_timestamp();
