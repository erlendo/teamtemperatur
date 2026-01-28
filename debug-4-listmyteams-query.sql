-- Test the exact query that listMyTeams() uses
-- Replace user_id with: 7cace60d-1d0e-4032-90ca-ff13e5206f2a (bekk.no)

SET LOCAL role TO postgres;

-- 1. Test raw query without RLS
SELECT 
  tm.team_id,
  tm.role,
  t.id,
  t.name
FROM public.team_memberships tm
JOIN public.teams t ON t.id = tm.team_id
WHERE tm.user_id = '7cace60d-1d0e-4032-90ca-ff13e5206f2a'
  AND tm.status = 'active';

-- 2. Test with tt_ views
SELECT 
  tm.team_id,
  tm.role,
  t.id,
  t.name
FROM public.tt_team_memberships tm
JOIN public.tt_teams t ON t.id = tm.team_id
WHERE tm.user_id = '7cace60d-1d0e-4032-90ca-ff13e5206f2a'
  AND tm.status = 'active';
