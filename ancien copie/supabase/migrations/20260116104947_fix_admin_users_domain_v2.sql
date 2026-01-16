/*
  # Fix Admin Users Domain - V2

  1. Purpose
    - Fix the domain for test admin users to match authentication system
    - Change from @test.local to @k3pr0s.local
    - Ensure proper authentication flow
    - Handle foreign key constraints properly

  2. Users Updated
    - super_admin@k3pr0s.local (Super Admin) - Full access
    - admin@k3pr0s.local (Admin) - OSINT & Dossiers
    - support@k3pr0s.local (Support) - Tickets & Client Relations

  3. Test Credentials
    - All users have password: TestPass123!
*/

-- Clean up existing admin_roles first
DELETE FROM admin_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('super_admin@test.local', 'admin@test.local', 'support@test.local', 'super_admin@k3pr0s.local', 'admin@k3pr0s.local', 'support@k3pr0s.local')
);

-- Clean up existing test users
DELETE FROM auth.users 
WHERE email IN ('super_admin@test.local', 'admin@test.local', 'support@test.local', 'super_admin@k3pr0s.local', 'admin@k3pr0s.local', 'support@k3pr0s.local');

-- Create Super Admin User
DO $$
DECLARE
  super_admin_id uuid;
  admin_id uuid;
  support_id uuid;
BEGIN
  -- Insert Super Admin
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'super_admin@k3pr0s.local',
    crypt('TestPass123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    '',
    ''
  )
  RETURNING id INTO super_admin_id;

  -- Insert Admin
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@k3pr0s.local',
    crypt('TestPass123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    '',
    ''
  )
  RETURNING id INTO admin_id;

  -- Insert Support
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'support@k3pr0s.local',
    crypt('TestPass123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    '',
    ''
  )
  RETURNING id INTO support_id;

  -- Assign Super Admin Role
  INSERT INTO admin_roles (user_id, role, permissions, created_by)
  VALUES (
    super_admin_id,
    'super_admin',
    jsonb_build_object(
      'manage_users', true,
      'manage_admins', true,
      'manage_dossiers', true,
      'manage_tickets', true,
      'manage_glpi', true,
      'view_analytics', true,
      'full_access', true
    ),
    super_admin_id
  );

  -- Assign Admin Role (OSINT & Dossiers focus)
  INSERT INTO admin_roles (user_id, role, permissions, created_by)
  VALUES (
    admin_id,
    'admin',
    jsonb_build_object(
      'manage_users', false,
      'manage_admins', false,
      'manage_dossiers', true,
      'manage_tickets', false,
      'manage_glpi', false,
      'view_analytics', true,
      'full_access', false
    ),
    super_admin_id
  );

  -- Assign Support Role (Tickets & Client Relations focus)
  INSERT INTO admin_roles (user_id, role, permissions, created_by)
  VALUES (
    support_id,
    'support',
    jsonb_build_object(
      'manage_users', false,
      'manage_admins', false,
      'manage_dossiers', false,
      'manage_tickets', true,
      'manage_glpi', true,
      'view_analytics', false,
      'full_access', false
    ),
    super_admin_id
  );

END $$;
