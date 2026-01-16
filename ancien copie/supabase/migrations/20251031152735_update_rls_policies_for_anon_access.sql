/*
  # Update RLS Policies for Anonymous Access

  ## Changes
  - Drop existing policies that require authentication
  - Create new policies that allow anonymous (anon) role access
  - This enables the demo app to work without user authentication

  ## Security Note
  - For production use, implement proper authentication
  - This configuration is for demo/testing purposes only
*/

-- Drop existing policies
DROP POLICY IF EXISTS "dossiers_all" ON dossiers;
DROP POLICY IF EXISTS "targets_all" ON targets;
DROP POLICY IF EXISTS "addresses_all" ON addresses;
DROP POLICY IF EXISTS "social_media_all" ON social_media;
DROP POLICY IF EXISTS "credentials_all" ON credentials;
DROP POLICY IF EXISTS "network_data_all" ON network_data;
DROP POLICY IF EXISTS "connections_all" ON connections;
DROP POLICY IF EXISTS "employment_all" ON employment;
DROP POLICY IF EXISTS "media_files_all" ON media_files;
DROP POLICY IF EXISTS "intelligence_notes_all" ON intelligence_notes;

-- Create new policies allowing anonymous access
CREATE POLICY "dossiers_anon_all" ON dossiers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "targets_anon_all" ON targets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "addresses_anon_all" ON addresses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "social_media_anon_all" ON social_media FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "credentials_anon_all" ON credentials FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "network_data_anon_all" ON network_data FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "connections_anon_all" ON connections FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "employment_anon_all" ON employment FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "media_files_anon_all" ON media_files FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "intelligence_notes_anon_all" ON intelligence_notes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Also create policies for authenticated users (for future use)
CREATE POLICY "dossiers_auth_all" ON dossiers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "targets_auth_all" ON targets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "addresses_auth_all" ON addresses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "social_media_auth_all" ON social_media FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "credentials_auth_all" ON credentials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "network_data_auth_all" ON network_data FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "connections_auth_all" ON connections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "employment_auth_all" ON employment FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "media_files_auth_all" ON media_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "intelligence_notes_auth_all" ON intelligence_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);