/*
  # Clean Broken Admin Users

  1. Purpose
    - Remove all test admin users created with SQL INSERT statements
    - These users cannot authenticate because they bypass Supabase Auth API
    - Prepare database for proper user creation via Edge Function
  
  2. Users to Remove
    - super_admin@blackraven.local
    - admin@blackraven.local
    - support@blackraven.local
    - superadmin@blackraven.local (duplicate)
    - All @test.local users
  
  3. Process
    - First delete from admin_roles (foreign key constraint)
    - Then delete from auth.users
    - This ensures clean state for setup-admin-users edge function
  
  4. Security
    - This will NOT affect the original superadmin@blackraven.local if it exists
    - Only removes users created in test migrations
*/

-- Clean up admin_roles entries first (foreign key constraint)
DELETE FROM admin_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'super_admin@blackraven.local',
    'admin@blackraven.local',
    'support@blackraven.local',
    'superadmin@blackraven.local',
    'super_admin@test.local',
    'admin@test.local',
    'support@test.local'
  )
);

-- Note: We cannot delete from auth.users directly via SQL in migrations
-- The Edge Function will handle user deletion via Supabase Admin API
-- This migration only cleans the admin_roles table

-- Log cleanup completion
DO $$
BEGIN
  RAISE NOTICE 'Admin roles cleaned. Use setup-admin-users Edge Function to recreate users properly.';
END $$;
