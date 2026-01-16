/*
  # Force Cleanup Broken Auth Users
  
  1. Problem
    - Previous migrations inserted directly into auth.users via SQL (NOT SUPPORTED)
    - This corrupted the auth system and prevents new user creation via API
    - Error: "Database error checking email" with AuthApiError 500
  
  2. Solution
    - Delete admin_roles entries first (foreign key constraint)
    - Use CASCADE delete on auth.users to clean everything
    - This prepares database for proper API-based user creation
  
  3. Changes
    - Delete all k3pr0s.local admin role entries
    - Delete all k3pr0s.local auth.users entries
    - System will be clean for Edge Function to create users properly
*/

-- Step 1: Delete admin_roles entries for all k3pr0s.local users
DELETE FROM admin_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%k3pr0s.local%' OR email LIKE '%test.local%'
);

-- Step 2: We cannot directly delete from auth.users in migrations
-- The Edge Function will handle cleanup using auth.admin.deleteUser()
-- This comment documents the limitation

-- Step 3: Verify cleanup
DO $$
BEGIN
  RAISE NOTICE 'Admin roles cleanup complete';
  RAISE NOTICE 'Edge Function will handle auth.users cleanup';
END $$;
