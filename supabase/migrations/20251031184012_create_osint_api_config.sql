/*
  # OSINT API Configuration Table

  1. New Tables
    - `osint_api_config`
      - `id` (uuid, primary key)
      - `api_token` (text, encrypted API token)
      - `api_url` (text, API endpoint URL)
      - `default_limit` (integer, default search limit)
      - `default_lang` (text, default language)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `osint_searches`
      - `id` (uuid, primary key)
      - `dossier_id` (uuid, foreign key to dossiers)
      - `query` (text, search query)
      - `limit` (integer, search limit used)
      - `lang` (text, language used)
      - `status` (text, search status: pending/processing/completed/failed)
      - `raw_results` (jsonb, raw API response)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for anonymous access (matching existing pattern)
*/

CREATE TABLE IF NOT EXISTS osint_api_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_token text NOT NULL,
  api_url text DEFAULT 'https://leakosintapi.com/',
  default_limit integer DEFAULT 100,
  default_lang text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE osint_api_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous access to osint_api_config"
  ON osint_api_config
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

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

ALTER TABLE osint_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select on osint_searches"
  ON osint_searches
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on osint_searches"
  ON osint_searches
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on osint_searches"
  ON osint_searches
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on osint_searches"
  ON osint_searches
  FOR DELETE
  TO anon
  USING (true);
