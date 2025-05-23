-- Create ENUM type for program status
CREATE TYPE app_schema.programme_status AS ENUM (
    'Brouillon',
    'Actif',
    'Terminé'
);

-- Create ENUM type for program template flag
CREATE TYPE app_schema.programme_template AS ENUM (
    'Modèle',
    'Non-Modèle'
);

-- Add status columns to the programme table
ALTER TABLE app_schema.programme 
ADD COLUMN status app_schema.programme_status NOT NULL DEFAULT 'Brouillon',
ADD COLUMN is_template app_schema.programme_template NOT NULL DEFAULT 'Non-Modèle';

-- Add index for faster queries on status
CREATE INDEX idx_programme_status ON app_schema.programme(status);
CREATE INDEX idx_programme_template ON app_schema.programme(is_template);
