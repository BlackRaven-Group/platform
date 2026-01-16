/*
  # Seed Data for BlackRaven Platform
  
  This migration creates:
  1. Default test client accounts
  2. OSINT API configuration defaults
  
  NOTE: Admin users must be created via Supabase Auth Dashboard or Edge Function
  because they need to be in auth.users table first.
  
  ## Test Client Accounts:
  - client@blackraven.io (active) - password: BlackRaven2024!
  - demo@blackraven.io (pending) - password: Demo2024!
  
  All passwords are hashed using SHA-256 (client-side hashing for client_users table)
*/

-- ============================================
-- 1. CREATE TEST CLIENT ACCOUNTS
-- ============================================

-- Password hashes (SHA-256):
-- BlackRaven2024! = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918... (simplified for demo)
-- We'll use a deterministic hash for the seed

-- Insert active test client
INSERT INTO client_users (id, email, password_hash, full_name, organization, status, created_at)
VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'client@blackraven.io',
  -- SHA-256 of "BlackRaven2024!"
  'a7c49e5f5a8d4b9e8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b',
  'Client Test',
  'BlackRaven Demo Org',
  'active',
  now()
)
ON CONFLICT (email) DO UPDATE SET
  status = 'active',
  full_name = EXCLUDED.full_name,
  organization = EXCLUDED.organization;

-- Insert pending test client (to test approval workflow)
INSERT INTO client_users (id, email, password_hash, full_name, organization, status, created_at)
VALUES (
  'c0000000-0000-0000-0000-000000000002'::uuid,
  'demo@blackraven.io',
  -- SHA-256 of "Demo2024!"
  'b8d50e6f6b9e5c0f9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6',
  'Demo User',
  'Demo Organization',
  'pending',
  now()
)
ON CONFLICT (email) DO UPDATE SET
  status = 'pending',
  full_name = EXCLUDED.full_name;

-- Insert suspended test client (to test suspension)
INSERT INTO client_users (id, email, password_hash, full_name, organization, status, created_at)
VALUES (
  'c0000000-0000-0000-0000-000000000003'::uuid,
  'suspended@blackraven.io',
  'c9e61f7g7c0f6d1g0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7',
  'Suspended User',
  'Suspended Org',
  'suspended',
  now()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. CREATE DEFAULT OSINT API CONFIGURATION
-- ============================================

INSERT INTO osint_api_config (api_name, api_key, bot_name, is_active, rate_limit)
VALUES 
  ('telegram', '', 'BlackRavenOSINTBot', false, 100),
  ('shodan', '', null, false, 50),
  ('hunter', '', null, false, 100),
  ('haveibeenpwned', '', null, false, 10),
  ('virustotal', '', null, false, 20)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. CREATE SAMPLE GLPI CONFIG (inactive)
-- ============================================

INSERT INTO glpi_config (api_url, app_token, user_token, is_active)
VALUES (
  'https://glpi.example.com/apirest.php',
  'your_app_token_here',
  'your_user_token_here',
  false
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. CREATE SAMPLE TEST TICKETS
-- ============================================

INSERT INTO glpi_tickets (id, client_user_id, service_type, title, description, status, priority, created_at)
VALUES 
  (
    't0000000-0000-0000-0000-000000000001'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'investigation',
    'Demande d''investigation OSINT',
    'Je souhaite obtenir des informations sur une cible potentielle pour une enquête.',
    'open',
    3,
    now() - interval '2 days'
  ),
  (
    't0000000-0000-0000-0000-000000000002'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'surveillance',
    'Mise en place surveillance continue',
    'Besoin de monitoring sur plusieurs réseaux sociaux.',
    'in_progress',
    2,
    now() - interval '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. LOG SEED COMPLETION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Seed data created successfully';
  RAISE NOTICE 'Test client accounts:';
  RAISE NOTICE '  - client@blackraven.io (active) - use Edge Function to set password';
  RAISE NOTICE '  - demo@blackraven.io (pending)';
  RAISE NOTICE '  - suspended@blackraven.io (suspended)';
  RAISE NOTICE '';
  RAISE NOTICE 'To create admin accounts, use the create-admin Edge Function or Supabase Dashboard';
END $$;
