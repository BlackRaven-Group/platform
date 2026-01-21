-- Ensure osint_api_config table exists with proper structure
-- This migration is idempotent and safe to run multiple times

CREATE TABLE IF NOT EXISTS osint_api_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_token text NOT NULL,
  api_url text DEFAULT 'https://leakosintapi.com/',
  default_limit integer DEFAULT 100,
  default_lang text DEFAULT 'en',
  bot_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'osint_api_config' AND column_name = 'bot_name') THEN
    ALTER TABLE osint_api_config ADD COLUMN bot_name text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE osint_api_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "osint_api_config_all_authenticated" ON osint_api_config;
DROP POLICY IF EXISTS "osint_api_config_anon_select" ON osint_api_config;
DROP POLICY IF EXISTS "Allow anonymous access to osint_api_config" ON osint_api_config;

-- Create policies for authenticated users
CREATE POLICY "osint_api_config_all_authenticated" ON osint_api_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users (for reading config)
CREATE POLICY "osint_api_config_anon_select" ON osint_api_config
  FOR SELECT
  TO anon
  USING (true);
