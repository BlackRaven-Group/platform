/*
  # BlackRaven Consolidated Database Schema
  
  This migration creates a clean, consolidated schema for the BlackRaven platform.
  All operations are idempotent (IF NOT EXISTS, ON CONFLICT DO NOTHING).
  
  ## Tables Created:
  1. dossiers - OSINT case management
  2. targets - Target profiles
  3. addresses - Physical locations
  4. social_media - Online presence
  5. credentials - Authentication data (leaked)
  6. network_data - IP and network info
  7. connections - Relationships
  8. employment - Work/education history
  9. media_files - Images and documents
  10. intelligence_notes - General intel
  11. phone_numbers - Phone data
  12. client_users - Client accounts
  13. client_sessions - Client sessions
  14. admin_roles - Admin roles and permissions
  15. admin_activity_log - Audit log
  16. glpi_config - Ticketing config
  17. glpi_tickets - Support tickets
  18. osint_api_config - API configurations
  19. map_pins - Map markers
  20. surveillance_cameras - Camera data cache
*/

-- ============================================
-- 1. DOSSIERS TABLE (OSINT Case Management)
-- ============================================
CREATE TABLE IF NOT EXISTS dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  code_name text,
  access_code text,
  failed_attempts integer DEFAULT 0,
  is_locked boolean DEFAULT false,
  status text DEFAULT 'open' CHECK (status IN ('open', 'active', 'closed', 'archived')),
  classification text DEFAULT 'confidential' CHECK (classification IN ('unclassified', 'confidential', 'secret', 'top_secret')),
  user_id uuid,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dossiers_user_id ON dossiers(user_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_status ON dossiers(status);
CREATE INDEX IF NOT EXISTS idx_dossiers_code_name ON dossiers(code_name);

ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dossiers_select_policy" ON dossiers;
CREATE POLICY "dossiers_select_policy" ON dossiers FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR auth.is_admin_user());

DROP POLICY IF EXISTS "dossiers_insert_policy" ON dossiers;
CREATE POLICY "dossiers_insert_policy" ON dossiers FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid() OR auth.is_admin_user());

DROP POLICY IF EXISTS "dossiers_update_policy" ON dossiers;
CREATE POLICY "dossiers_update_policy" ON dossiers FOR UPDATE TO authenticated 
  USING (user_id = auth.uid() OR auth.is_admin_user());

DROP POLICY IF EXISTS "dossiers_delete_policy" ON dossiers;
CREATE POLICY "dossiers_delete_policy" ON dossiers FOR DELETE TO authenticated 
  USING (user_id = auth.uid() OR auth.is_admin_user());

-- ============================================
-- 2. TARGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid REFERENCES dossiers(id) ON DELETE CASCADE,
  code_name text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  aliases text[] DEFAULT '{}',
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  nationality text,
  profile_image_url text,
  bio text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased', 'unknown')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_targets_dossier_id ON targets(dossier_id);
CREATE INDEX IF NOT EXISTS idx_targets_code_name ON targets(code_name);

ALTER TABLE targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "targets_all_policy" ON targets;
CREATE POLICY "targets_all_policy" ON targets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 3. ADDRESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  address_type text DEFAULT 'current' CHECK (address_type IN ('current', 'previous', 'work', 'other')),
  street_address text,
  city text,
  state text,
  postal_code text,
  country text,
  latitude numeric,
  longitude numeric,
  verified boolean DEFAULT false,
  last_seen timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_target_id ON addresses(target_id);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_all_policy" ON addresses;
CREATE POLICY "addresses_all_policy" ON addresses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 4. SOCIAL_MEDIA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS social_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  platform text NOT NULL,
  username text,
  profile_url text,
  follower_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
  last_activity timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_media_target_id ON social_media(target_id);
CREATE INDEX IF NOT EXISTS idx_social_media_platform ON social_media(platform);

ALTER TABLE social_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_media_all_policy" ON social_media;
CREATE POLICY "social_media_all_policy" ON social_media FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 5. CREDENTIALS TABLE (Leaked Data)
-- ============================================
CREATE TABLE IF NOT EXISTS credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  service text,
  username text,
  email text,
  password_encrypted text,
  password_hash text,
  breach_source text,
  breach_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'changed', 'unknown')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credentials_target_id ON credentials(target_id);

ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credentials_all_policy" ON credentials;
CREATE POLICY "credentials_all_policy" ON credentials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 6. NETWORK_DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS network_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  ip_address inet,
  ip_type text CHECK (ip_type IN ('ipv4', 'ipv6')),
  isp text,
  location text,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  confidence text DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_network_data_target_id ON network_data(target_id);

ALTER TABLE network_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "network_data_all_policy" ON network_data;
CREATE POLICY "network_data_all_policy" ON network_data FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 7. CONNECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  connected_target_id uuid REFERENCES targets(id) ON DELETE SET NULL,
  connection_name text,
  relationship_type text CHECK (relationship_type IN ('family', 'friend', 'colleague', 'associate', 'romantic', 'financial', 'other')),
  relationship_details text DEFAULT '',
  strength integer DEFAULT 5 CHECK (strength >= 1 AND strength <= 10),
  verified boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_connections_target_id ON connections(target_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_target_id ON connections(connected_target_id);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connections_all_policy" ON connections;
CREATE POLICY "connections_all_policy" ON connections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 8. EMPLOYMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  record_type text CHECK (record_type IN ('employment', 'education', 'military', 'other')),
  organization text NOT NULL,
  position text,
  location text,
  start_date date,
  end_date date,
  current boolean DEFAULT false,
  verified boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employment_target_id ON employment(target_id);

ALTER TABLE employment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employment_all_policy" ON employment;
CREATE POLICY "employment_all_policy" ON employment FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 9. MEDIA_FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  file_type text CHECK (file_type IN ('image', 'video', 'audio', 'document', 'other')),
  file_url text NOT NULL,
  title text,
  description text DEFAULT '',
  captured_date timestamptz,
  source text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_files_target_id ON media_files(target_id);

ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_files_all_policy" ON media_files;
CREATE POLICY "media_files_all_policy" ON media_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 10. INTELLIGENCE_NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS intelligence_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid REFERENCES dossiers(id) ON DELETE CASCADE,
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  category text CHECK (category IN ('humint', 'sigint', 'osint', 'techint', 'finint', 'general')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  content text NOT NULL,
  source text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_notes_dossier_id ON intelligence_notes(dossier_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_notes_target_id ON intelligence_notes(target_id);

ALTER TABLE intelligence_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "intelligence_notes_all_policy" ON intelligence_notes;
CREATE POLICY "intelligence_notes_all_policy" ON intelligence_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 11. PHONE_NUMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  number_type text DEFAULT 'mobile' CHECK (number_type IN ('mobile', 'landline', 'work', 'fax', 'other')),
  country_code text,
  carrier text,
  verified boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'unknown')),
  strength integer DEFAULT 5 CHECK (strength >= 1 AND strength <= 10),
  last_seen timestamptz,
  source text,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_target_id ON phone_numbers(target_id);

ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "phone_numbers_all_policy" ON phone_numbers;
CREATE POLICY "phone_numbers_all_policy" ON phone_numbers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 12. CLIENT_USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS client_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  organization text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_status ON client_users(status);

ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- Anon can register
DROP POLICY IF EXISTS "client_users_insert_anon" ON client_users;
CREATE POLICY "client_users_insert_anon" ON client_users FOR INSERT TO anon WITH CHECK (true);

-- Anon can select for login validation
DROP POLICY IF EXISTS "client_users_select_anon" ON client_users;
CREATE POLICY "client_users_select_anon" ON client_users FOR SELECT TO anon USING (true);

-- Admins can manage all client users
DROP POLICY IF EXISTS "client_users_admin_all" ON client_users;
CREATE POLICY "client_users_admin_all" ON client_users FOR ALL TO authenticated 
  USING (auth.is_admin_user())
  WITH CHECK (auth.is_admin_user());

-- ============================================
-- 13. CLIENT_SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS client_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON client_sessions(token);
CREATE INDEX IF NOT EXISTS idx_client_sessions_client_user_id ON client_sessions(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_expires_at ON client_sessions(expires_at);

ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_sessions_anon_all" ON client_sessions;
CREATE POLICY "client_sessions_anon_all" ON client_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- 14. ADMIN_ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'support', 'viewer')),
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin status (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION auth.is_admin_user(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = check_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check super admin status
CREATE OR REPLACE FUNCTION auth.is_super_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = check_user_id AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Admins can view all roles (using helper function to avoid circular reference)
DROP POLICY IF EXISTS "admin_roles_select" ON admin_roles;
CREATE POLICY "admin_roles_select" ON admin_roles FOR SELECT TO authenticated 
  USING (auth.is_admin_user());

-- Super admins can manage roles
DROP POLICY IF EXISTS "admin_roles_insert" ON admin_roles;
CREATE POLICY "admin_roles_insert" ON admin_roles FOR INSERT TO authenticated 
  WITH CHECK (auth.is_super_admin());

DROP POLICY IF EXISTS "admin_roles_update" ON admin_roles;
CREATE POLICY "admin_roles_update" ON admin_roles FOR UPDATE TO authenticated 
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

DROP POLICY IF EXISTS "admin_roles_delete" ON admin_roles;
CREATE POLICY "admin_roles_delete" ON admin_roles FOR DELETE TO authenticated 
  USING (auth.is_super_admin());

-- ============================================
-- 15. ADMIN_ACTIVITY_LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_activity_log_select" ON admin_activity_log;
CREATE POLICY "admin_activity_log_select" ON admin_activity_log FOR SELECT TO authenticated 
  USING (auth.is_admin_user());

DROP POLICY IF EXISTS "admin_activity_log_insert" ON admin_activity_log;
CREATE POLICY "admin_activity_log_insert" ON admin_activity_log FOR INSERT TO authenticated 
  WITH CHECK (admin_id = auth.uid());

-- ============================================
-- 16. GLPI_CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS glpi_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL,
  app_token text NOT NULL,
  user_token text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE glpi_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "glpi_config_admin" ON glpi_config;
CREATE POLICY "glpi_config_admin" ON glpi_config FOR ALL TO authenticated 
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

-- ============================================
-- 17. GLPI_TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS glpi_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid REFERENCES client_users(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  glpi_ticket_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'in_progress', 'resolved', 'closed')),
  priority integer DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  assigned_to uuid,
  response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_glpi_tickets_client_user_id ON glpi_tickets(client_user_id);
CREATE INDEX IF NOT EXISTS idx_glpi_tickets_status ON glpi_tickets(status);
CREATE INDEX IF NOT EXISTS idx_glpi_tickets_created_at ON glpi_tickets(created_at DESC);

ALTER TABLE glpi_tickets ENABLE ROW LEVEL SECURITY;

-- Anon can create tickets (for client portal)
DROP POLICY IF EXISTS "glpi_tickets_insert_anon" ON glpi_tickets;
CREATE POLICY "glpi_tickets_insert_anon" ON glpi_tickets FOR INSERT TO anon WITH CHECK (true);

-- Anon can view their tickets (via session token validation in app)
DROP POLICY IF EXISTS "glpi_tickets_select_anon" ON glpi_tickets;
CREATE POLICY "glpi_tickets_select_anon" ON glpi_tickets FOR SELECT TO anon USING (true);

-- Admins can manage all tickets
DROP POLICY IF EXISTS "glpi_tickets_admin_all" ON glpi_tickets;
CREATE POLICY "glpi_tickets_admin_all" ON glpi_tickets FOR ALL TO authenticated 
  USING (auth.is_admin_user())
  WITH CHECK (auth.is_admin_user());

-- ============================================
-- 18. OSINT_API_CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS osint_api_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text NOT NULL,
  api_key text,
  bot_name text,
  is_active boolean DEFAULT true,
  rate_limit integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_osint_api_config_api_name ON osint_api_config(api_name);

ALTER TABLE osint_api_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "osint_api_config_admin" ON osint_api_config;
CREATE POLICY "osint_api_config_admin" ON osint_api_config FOR ALL TO authenticated 
  USING (auth.is_admin_user())
  WITH CHECK (auth.is_admin_user());

-- ============================================
-- 19. MAP_PINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS map_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  category text DEFAULT 'default',
  description text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_map_pins_category ON map_pins(category);
CREATE INDEX IF NOT EXISTS idx_map_pins_location ON map_pins(latitude, longitude);

ALTER TABLE map_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "map_pins_all" ON map_pins;
CREATE POLICY "map_pins_all" ON map_pins FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "map_pins_anon_select" ON map_pins;
CREATE POLICY "map_pins_anon_select" ON map_pins FOR SELECT TO anon USING (true);

-- ============================================
-- 20. SURVEILLANCE_CAMERAS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS surveillance_cameras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text,
  name text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  country text,
  city text,
  type text DEFAULT 'traffic',
  stream_url text,
  thumbnail_url text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'unknown')),
  last_checked timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_surveillance_cameras_location ON surveillance_cameras(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_surveillance_cameras_country ON surveillance_cameras(country);
CREATE INDEX IF NOT EXISTS idx_surveillance_cameras_status ON surveillance_cameras(status);

ALTER TABLE surveillance_cameras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "surveillance_cameras_all" ON surveillance_cameras;
CREATE POLICY "surveillance_cameras_all" ON surveillance_cameras FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 21. SERVICE_REQUESTS TABLE (PGP Messages)
-- ============================================
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES client_users(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  encrypted_message text NOT NULL,
  client_public_key text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_requests_anon_insert" ON service_requests;
CREATE POLICY "service_requests_anon_insert" ON service_requests FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "service_requests_anon_select" ON service_requests;
CREATE POLICY "service_requests_anon_select" ON service_requests FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "service_requests_admin_all" ON service_requests;
CREATE POLICY "service_requests_admin_all" ON service_requests FOR ALL TO authenticated 
  USING (auth.is_admin_user())
  WITH CHECK (auth.is_admin_user());

-- ============================================
-- 22. SERVICE_RESPONSES TABLE (PGP Responses)
-- ============================================
CREATE TABLE IF NOT EXISTS service_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  support_user_id uuid,
  encrypted_response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_responses_request_id ON service_responses(request_id);

ALTER TABLE service_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_responses_anon_select" ON service_responses;
CREATE POLICY "service_responses_anon_select" ON service_responses FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "service_responses_admin_all" ON service_responses;
CREATE POLICY "service_responses_admin_all" ON service_responses FOR ALL TO authenticated 
  USING (auth.is_admin_user())
  WITH CHECK (auth.is_admin_user());

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_roles WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user permission
CREATE OR REPLACE FUNCTION has_permission(user_uuid uuid, permission_name text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  user_permissions jsonb;
BEGIN
  SELECT role, permissions INTO user_role, user_permissions
  FROM admin_roles
  WHERE user_id = user_uuid;
  
  IF user_role IS NULL THEN RETURN false; END IF;
  IF user_role = 'super_admin' THEN RETURN true; END IF;
  
  RETURN COALESCE((user_permissions->permission_name)::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['dossiers', 'targets', 'client_users', 'admin_roles', 'glpi_tickets', 'osint_api_config', 'map_pins'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END $$;

-- Function to cleanup expired client sessions
CREATE OR REPLACE FUNCTION cleanup_expired_client_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM client_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORAGE BUCKET FOR IMAGES
-- ============================================
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile-images', 'profile-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;
