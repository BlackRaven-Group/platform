/*
  # Add Dossier Security and Code Names

  1. Changes
    - Add code_name field for display (randomized surname-based identifier)
    - Add access_code field (hashed PIN for dossier access)
    - Add failed_attempts counter
    - Add is_locked flag for security state

  2. Security
    - Code-protected access
    - Auto-delete after 5 failed attempts
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dossiers' AND column_name = 'code_name'
  ) THEN
    ALTER TABLE dossiers ADD COLUMN code_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dossiers' AND column_name = 'access_code'
  ) THEN
    ALTER TABLE dossiers ADD COLUMN access_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dossiers' AND column_name = 'failed_attempts'
  ) THEN
    ALTER TABLE dossiers ADD COLUMN failed_attempts int DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dossiers' AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE dossiers ADD COLUMN is_locked boolean DEFAULT false;
  END IF;
END $$;
