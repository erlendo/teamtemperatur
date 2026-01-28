-- Query 1: Check if ANY teams exist at all
SET LOCAL role TO postgres;

SELECT id, name, created_by, created_at
FROM public.teams
ORDER BY created_at DESC
LIMIT 20;
