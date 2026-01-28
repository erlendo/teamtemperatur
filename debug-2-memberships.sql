-- Query 2: Check ALL memberships in database
SET LOCAL role TO postgres;

SELECT 
  tm.team_id,
  tm.user_id,
  tm.role,
  tm.status,
  t.name as team_name,
  u.email as user_email
FROM public.team_memberships tm
JOIN public.teams t ON t.id = tm.team_id
LEFT JOIN auth.users u ON u.id = tm.user_id
ORDER BY tm.created_at DESC
LIMIT 20;
