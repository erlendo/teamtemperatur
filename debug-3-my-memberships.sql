-- Query 3: Check YOUR specific memberships
SET LOCAL role TO postgres;

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
