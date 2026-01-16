/*
  # OSINT Intelligence Database Schema

  ## Overview
  Complete database structure for OSINT intelligence gathering and reporting system.

  ## New Tables
  1. dossiers - Case management
  2. targets - Individual profiles
  3. addresses - Physical locations
  4. social_media - Online presence
  5. credentials - Authentication data
  6. network_data - IP and network info
  7. connections - Relationships
  8. employment - Work/education history
  9. media_files - Images and documents
  10. intelligence_notes - General intel

  ## Security
  - RLS enabled on all tables
  - Full access for authenticated users
*/

-- Dossiers table
CREATE TABLE IF NOT EXISTS dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'open',
  classification text DEFAULT 'confidential',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dossiers_all" ON dossiers FOR ALL TO authenticated USING (true) WITH CHECK (true);