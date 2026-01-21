-- Ensure osint_searches table exists with proper structure
-- This migration is idempotent and safe to run multiple times

CREATE TABLE IF NOT EXISTS osint_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid REFERENCES dossiers(id) ON DELETE CASCADE,
  query text NOT NULL,
  limit_used integer DEFAULT 100,
  lang text DEFAULT 'en',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'confirmed')),
  raw_results jsonb,
  parsed_results jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'osint_searches' AND column_name = 'limit_used') THEN
    ALTER TABLE osint_searches ADD COLUMN limit_used integer DEFAULT 100;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'osint_searches' AND column_name = 'parsed_results') THEN
    ALTER TABLE osint_searches ADD COLUMN parsed_results jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'osint_searches' AND column_name = 'error_message') THEN
    ALTER TABLE osint_searches ADD COLUMN error_message text;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_osint_searches_dossier_id ON osint_searches(dossier_id);
CREATE INDEX IF NOT EXISTS idx_osint_searches_status ON osint_searches(status);
CREATE INDEX IF NOT EXISTS idx_osint_searches_created_at ON osint_searches(created_at DESC);

-- Enable RLS
ALTER TABLE osint_searches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "osint_searches_all_authenticated" ON osint_searches;
DROP POLICY IF EXISTS "osint_searches_anon_select" ON osint_searches;
DROP POLICY IF EXISTS "osint_searches_anon_insert" ON osint_searches;
DROP POLICY IF EXISTS "osint_searches_anon_update" ON osint_searches;
DROP POLICY IF EXISTS "osint_searches_anon_delete" ON osint_searches;
DROP POLICY IF EXISTS "Allow anonymous select on osint_searches" ON osint_searches;
DROP POLICY IF EXISTS "Allow anonymous insert on osint_searches" ON osint_searches;
DROP POLICY IF EXISTS "Allow anonymous update on osint_searches" ON osint_searches;
DROP POLICY IF EXISTS "Allow anonymous delete on osint_searches" ON osint_searches;

-- Create policies for authenticated users
CREATE POLICY "osint_searches_all_authenticated" ON osint_searches
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for anonymous users (for API access)
CREATE POLICY "osint_searches_anon_select" ON osint_searches
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "osint_searches_anon_insert" ON osint_searches
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "osint_searches_anon_update" ON osint_searches
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "osint_searches_anon_delete" ON osint_searches
  FOR DELETE
  TO anon
  USING (true);
