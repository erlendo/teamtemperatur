-- Debug: Check user's team memberships - BYPASS RLS
-- User: fdfcbb2a-e2cc-4b9f-a234-56201e77d64f

-- RLS is blocking because auth.uid() = NULL in SQL Editor
-- These queries DISABLE RLS to see raw data

-- DISABLE RLS temporarily (requires service_role/postgres permissions)
SET LOCAL role TO postgres;

-- 1. Check if NOKUT team exists
SELECT id, name, created_by, created_at 
FROM public.teams 
WHERE name ILIKE '%NOKUT%'
ORDER BY created_at DESC;

-- 2. Find ALL teams this user created
SELECT id, name, created_by, created_at 
FROM public.teams 
WHERE created_by = 'fdfcbb2a-e2cc-4b9f-a234-56201e77d64f'
ORDER BY created_at DESC;

-- 3. Check ALL memberships for this user (RAW - no RLS)
SELECT 
  tm.team_id,
  tm.user_id,
  tm.role,
  tm.status,
  tm.created_at,
  t.name as team_name
FROM public.team_memberships tm
JOIN public.teams t ON t.id = tm.team_id
WHERE tm.user_id = 'fdfcbb2a-e2cc-4b9f-a234-56201e77d64f'
ORDER BY tm.created_at DESC;

-- 4. Count memberships
SELECT COUNT(*) as total_memberships
FROM public.team_memberships 
WHERE user_id = 'fdfcbb2a-e2cc-4b9f-a234-56201e77d64f';

-- 5. Check your auth.users entry
SELECT id, email, created_at, last_sign_in_at
FROM auth.users 
WHERE id = 'fdfcbb2a-e2cc-4b9f-a234-56201e77d64f';

-- 6. Check if ANY teams exist at all in the database
SELECT id, name, created_by, created_at
FROM public.teams
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check if ANY memberships exist
SELECT COUNT(*) as total_memberships_in_db
FROM public.team_memberships;

-- 8. Check all users in the system
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
