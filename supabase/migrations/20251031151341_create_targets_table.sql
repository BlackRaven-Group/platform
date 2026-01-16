/*
  # Targets Table
  Individual target/subject profiles with comprehensive personal data
*/

CREATE TABLE IF NOT EXISTS targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid REFERENCES dossiers(id) ON DELETE CASCADE,
  code_name text NOT NULL,
  first_name text DEFAULT 'ND',
  last_name text DEFAULT 'ND',
  aliases jsonb DEFAULT '[]'::jsonb,
  date_of_birth date,
  gender text DEFAULT 'ND',
  nationality text DEFAULT 'ND',
  profile_image_url text,
  bio text DEFAULT '',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_targets_dossier_id ON targets(dossier_id);

ALTER TABLE targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "targets_all" ON targets FOR ALL TO authenticated USING (true) WITH CHECK (true);