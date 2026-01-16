/*
  # Admin Management System

  1. New Tables
    - `admin_roles`
      - `id` (uuid, primary key) - Role identifier
      - `user_id` (uuid, foreign key) - Reference to auth.users
      - `role` (text) - Role type: super_admin, admin, support, viewer
      - `permissions` (jsonb) - Permissions object
      - `created_at` (timestamptz) - Creation timestamp
      - `created_by` (uuid) - Admin who created this role
      - `updated_at` (timestamptz) - Last update timestamp

    - `admin_activity_log`
      - `id` (uuid, primary key) - Log entry identifier
      - `admin_id` (uuid) - Reference to auth.users
      - `action` (text) - Action performed
      - `target_type` (text) - Type of target (client_user, ticket, dossier, etc.)
      - `target_id` (uuid) - ID of affected resource
      - `details` (jsonb) - Additional details
      - `created_at` (timestamptz) - Timestamp of action

  2. Security
    - Enable RLS on both tables
    - Only authenticated admins can access
    - Super admins can manage all roles
    - Admins can view roles but not modify super_admin roles
    - Activity log is read-only for auditing

  3. Permissions Structure
    - manage_users: Can create/update/delete users
    - manage_tickets: Can view/update tickets
    - manage_dossiers: Can create/view/update dossiers
    - manage_admins: Can create/update admin accounts
    - view_analytics: Can view system analytics
    - manage_glpi: Can configure GLPI settings

  4. Important Notes
    - Super admin has all permissions
    - First admin should be created via edge function
    - Activity log tracks all admin actions for compliance
    - Roles are tied to Supabase auth.users table
*/

-- Create admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'support', 'viewer')),
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create admin_activity_log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target ON admin_activity_log(target_type, target_id);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_roles
CREATE POLICY "Authenticated admins can view roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can insert roles"
  ON admin_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update roles"
  ON admin_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete roles"
  ON admin_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin'
    )
  );

-- RLS Policies for admin_activity_log
CREATE POLICY "Admins can view activity log"
  ON admin_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activity log"
  ON admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_roles_updated_at()
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
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_admin_roles_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_admin_roles_updated_at_trigger
      BEFORE UPDATE ON admin_roles
      FOR EACH ROW
      EXECUTE FUNCTION update_admin_roles_updated_at();
  END IF;
END $$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(user_uuid uuid, permission_name text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  user_permissions jsonb;
BEGIN
  SELECT role, permissions INTO user_role, user_permissions
  FROM admin_roles
  WHERE user_id = user_uuid;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  RETURN (user_permissions->permission_name)::boolean = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update client_users RLS to allow admins to manage
CREATE POLICY "Admins can view all client users"
  ON client_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update client users"
  ON client_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
      AND (ar.role = 'super_admin' OR ar.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
      AND (ar.role = 'super_admin' OR ar.role = 'admin')
    )
  );

-- Allow admins to view all tickets
CREATE POLICY "Admins can view all tickets"
  ON glpi_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update tickets"
  ON glpi_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
    )
  );
