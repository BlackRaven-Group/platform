/*
  # Fix Admin Roles RLS Policies

  1. Changes
    - Drop existing restrictive RLS policies on admin_roles
    - Create new policy allowing authenticated users to view their own role
    - This fixes the circular dependency where users couldn't see their role unless they already had a role

  2. Security
    - Users can only view their OWN role (WHERE user_id = auth.uid())
    - Super admins retain full management capabilities
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated admins can view roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON admin_roles;

-- Allow authenticated users to view their own role
CREATE POLICY "Users can view own role"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Super admins can view all roles
CREATE POLICY "Super admins can view all roles"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
      AND ar.role IN ('super_admin', 'admin')
    )
  );

-- Super admins can insert new roles
CREATE POLICY "Super admins can insert roles"
  ON admin_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
      AND ar.role = 'super_admin'
    )
  );

-- Super admins can update roles
CREATE POLICY "Super admins can update roles"
  ON admin_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
      AND ar.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
      AND ar.role = 'super_admin'
    )
  );

-- Super admins can delete roles
CREATE POLICY "Super admins can delete roles"
  ON admin_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
      AND ar.role = 'super_admin'
    )
  );
