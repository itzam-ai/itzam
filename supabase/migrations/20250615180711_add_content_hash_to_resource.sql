-- Add content_hash column to resource table
ALTER TABLE resource ADD COLUMN IF NOT EXISTS content_hash VARCHAR(256);