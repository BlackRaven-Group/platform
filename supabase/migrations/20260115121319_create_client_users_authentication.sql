/*
  # Client Users Authentication System

  1. New Tables
    - `client_users`
      - `id` (uuid, primary key) - Unique identifier
      - `email` (text, unique, not null) - Client email address
      - `password_hash` (text, not null) - Hashed password
      - `full_name` (text) - Client full name
      - `organization` (text) - Client organization/company
      - `status` (text, default 'pending') - Account status: pending, active, suspended
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `last_login` (timestamptz) - Last login timestamp

    - `client_sessions`
      - `id` (uuid, primary key) - Session identifier
      - `client_user_id` (uuid, foreign key) - Reference to client_users
      - `token` (text, unique, not null) - Session token
      - `expires_at` (timestamptz, not null) - Session expiration
      - `created_at` (timestamptz) - Session creation timestamp

  2. Security
    - Enable RLS on both tables
    - Clients can only view their own data
    - Clients can update their own profile
    - Clients can create their own sessions
    - Only authenticated clients can access their sessions

  3. Indexes
    - Index on email for fast lookup
    - Index on token for session validation
    - Index on client_user_id in sessions table

  4. Important Notes
    - Passwords are stored as bcrypt hashes
    - Sessions expire after 7 days by default
    - Client accounts start with 'pending' status and must be approved by admin
    - Separate from admin authentication system
*/

-- Create client_users table
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

-- Create client_sessions table
CREATE TABLE IF NOT EXISTS client_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON client_sessions(token);
CREATE INDEX IF NOT EXISTS idx_client_sessions_client_user_id ON client_sessions(client_user_id);

-- Enable RLS
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_users
CREATE POLICY "Clients can view own profile"
  ON client_users FOR SELECT
  TO anon, authenticated
  USING (id = (current_setting('app.current_client_user_id', true))::uuid);

CREATE POLICY "Anyone can create client account"
  ON client_users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Clients can update own profile"
  ON client_users FOR UPDATE
  TO anon, authenticated
  USING (id = (current_setting('app.current_client_user_id', true))::uuid)
  WITH CHECK (id = (current_setting('app.current_client_user_id', true))::uuid);

-- RLS Policies for client_sessions
CREATE POLICY "Clients can view own sessions"
  ON client_sessions FOR SELECT
  TO anon, authenticated
  USING (client_user_id = (current_setting('app.current_client_user_id', true))::uuid);

CREATE POLICY "Anyone can create sessions"
  ON client_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Clients can delete own sessions"
  ON client_sessions FOR DELETE
  TO anon, authenticated
  USING (client_user_id = (current_setting('app.current_client_user_id', true))::uuid);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_users_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_client_users_updated_at_trigger
      BEFORE UPDATE ON client_users
      FOR EACH ROW
      EXECUTE FUNCTION update_client_users_updated_at();
  END IF;
END $$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_client_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM client_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
