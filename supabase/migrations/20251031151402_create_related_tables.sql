/*
  # Related Tables for OSINT Data
  Addresses, social media, credentials, network data, connections, employment, media, notes
*/

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  address_type text DEFAULT 'known-location',
  street_address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  postal_code text DEFAULT '',
  country text DEFAULT '',
  latitude numeric,
  longitude numeric,
  verified boolean DEFAULT false,
  last_seen timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Social Media
CREATE TABLE IF NOT EXISTS social_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  platform text NOT NULL,
  username text DEFAULT '',
  profile_url text DEFAULT '',
  follower_count integer DEFAULT 0,
  status text DEFAULT 'active',
  last_activity timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Credentials
CREATE TABLE IF NOT EXISTS credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  service text NOT NULL,
  username text DEFAULT '',
  email text DEFAULT '',
  password_encrypted text DEFAULT '',
  password_hash text DEFAULT '',
  breach_source text DEFAULT '',
  breach_date date,
  status text DEFAULT 'unknown',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Network Data
CREATE TABLE IF NOT EXISTS network_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  ip_address text NOT NULL,
  ip_type text DEFAULT 'unknown',
  isp text DEFAULT 'ND',
  location text DEFAULT 'ND',
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  confidence text DEFAULT 'medium',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Connections
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  connected_target_id uuid REFERENCES targets(id) ON DELETE SET NULL,
  connection_name text DEFAULT '',
  relationship_type text NOT NULL,
  relationship_details text DEFAULT '',
  strength integer DEFAULT 5,
  verified boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Employment
CREATE TABLE IF NOT EXISTS employment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  record_type text NOT NULL,
  organization text NOT NULL,
  position text DEFAULT '',
  location text DEFAULT '',
  start_date date,
  end_date date,
  current boolean DEFAULT false,
  verified boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Media Files
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  file_type text NOT NULL,
  file_url text NOT NULL,
  title text DEFAULT '',
  description text DEFAULT '',
  captured_date timestamptz,
  source text DEFAULT '',
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Intelligence Notes
CREATE TABLE IF NOT EXISTS intelligence_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid REFERENCES dossiers(id) ON DELETE CASCADE,
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  category text DEFAULT 'observation',
  priority text DEFAULT 'medium',
  content text NOT NULL,
  source text DEFAULT '',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_addresses_target_id ON addresses(target_id);
CREATE INDEX IF NOT EXISTS idx_social_media_target_id ON social_media(target_id);
CREATE INDEX IF NOT EXISTS idx_credentials_target_id ON credentials(target_id);
CREATE INDEX IF NOT EXISTS idx_network_data_target_id ON network_data(target_id);
CREATE INDEX IF NOT EXISTS idx_connections_target_id ON connections(target_id);
CREATE INDEX IF NOT EXISTS idx_employment_target_id ON employment(target_id);
CREATE INDEX IF NOT EXISTS idx_media_files_target_id ON media_files(target_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_notes_dossier_id ON intelligence_notes(dossier_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_notes_target_id ON intelligence_notes(target_id);

-- Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "addresses_all" ON addresses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "social_media_all" ON social_media FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "credentials_all" ON credentials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "network_data_all" ON network_data FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "connections_all" ON connections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "employment_all" ON employment FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "media_files_all" ON media_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "intelligence_notes_all" ON intelligence_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);