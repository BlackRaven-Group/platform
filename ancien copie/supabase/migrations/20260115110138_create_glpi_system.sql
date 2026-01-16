/*
  # GLPI Integration System

  1. New Tables
    - `glpi_config`
      - `id` (uuid, primary key)
      - `api_url` (text) - GLPI instance URL
      - `app_token` (text) - GLPI application token
      - `user_token` (text) - GLPI user token
      - `is_active` (boolean) - Whether GLPI is enabled
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `glpi_tickets`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to user_profiles)
      - `service_type` (text) - Type of service requested
      - `title` (text) - Ticket title
      - `description` (text) - Ticket description
      - `glpi_ticket_id` (text) - ID from GLPI system
      - `status` (text) - pending, open, in_progress, resolved, closed
      - `priority` (integer) - 1-5 priority level
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - glpi_config: Only accessible by super_admin
    - glpi_tickets: Users can only see their own tickets
*/

-- GLPI Configuration Table
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

-- Only super admins can access GLPI config
CREATE POLICY "Super admins can manage GLPI config"
  ON glpi_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

-- GLPI Tickets Table
CREATE TABLE IF NOT EXISTS glpi_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  glpi_ticket_id text,
  status text DEFAULT 'pending',
  priority integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE glpi_tickets ENABLE ROW LEVEL SECURITY;

-- Clients can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON glpi_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

-- Clients can create their own tickets
CREATE POLICY "Users can create own tickets"
  ON glpi_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Support team can view all tickets
CREATE POLICY "Support can view all tickets"
  ON glpi_tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('support', 'super_admin')
    )
  );

-- Support team can update all tickets
CREATE POLICY "Support can update all tickets"
  ON glpi_tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('support', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('support', 'super_admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_glpi_tickets_client_id ON glpi_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_glpi_tickets_status ON glpi_tickets(status);
CREATE INDEX IF NOT EXISTS idx_glpi_tickets_created_at ON glpi_tickets(created_at DESC);
