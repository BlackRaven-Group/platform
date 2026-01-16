/*
  # Add Username/Password Authentication System

  1. Changes
    - Disable email confirmation in auth settings
    - Add username field to user metadata
    - Create user_profiles table for additional user data
    - Link dossiers to specific users
    - Add user_id to dossiers table
    
  2. Security
    - Enable RLS on user_profiles table
    - Users can only read their own profile
    - Users can only access their assigned dossiers
    - Update dossiers RLS to check user ownership
*/

-- Add user_id column to dossiers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dossiers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE dossiers ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create user_profiles table for username storage
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update dossiers RLS to check user ownership
DROP POLICY IF EXISTS "Anyone can view dossiers" ON dossiers;
DROP POLICY IF EXISTS "Anyone can insert dossiers" ON dossiers;
DROP POLICY IF EXISTS "Anyone can update dossiers" ON dossiers;
DROP POLICY IF EXISTS "Anyone can delete dossiers" ON dossiers;

-- Only authenticated users can access their own dossiers
CREATE POLICY "Users can view own dossiers"
  ON dossiers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dossiers"
  ON dossiers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dossiers"
  ON dossiers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dossiers"
  ON dossiers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update related tables RLS to check dossier ownership
DROP POLICY IF EXISTS "Anyone can view targets" ON targets;
DROP POLICY IF EXISTS "Anyone can insert targets" ON targets;
DROP POLICY IF EXISTS "Anyone can update targets" ON targets;
DROP POLICY IF EXISTS "Anyone can delete targets" ON targets;

CREATE POLICY "Users can view targets in own dossiers"
  ON targets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = targets.dossier_id
      AND dossiers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert targets in own dossiers"
  ON targets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = targets.dossier_id
      AND dossiers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update targets in own dossiers"
  ON targets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = targets.dossier_id
      AND dossiers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = targets.dossier_id
      AND dossiers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete targets in own dossiers"
  ON targets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = targets.dossier_id
      AND dossiers.user_id = auth.uid()
    )
  );