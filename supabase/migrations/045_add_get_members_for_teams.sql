-- Migration 045: Add batched get_members_for_teams function
-- Replaces N individual get_team_members_with_emails calls in listMyTeams()
-- with a single query across all of a user's teams.

CREATE OR REPLACE FUNCTION public.get_members_for_teams(p_team_ids uuid[])
RETURNS TABLE (
  team_id uuid,
  user_id uuid,
  role text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tm.team_id,
    tm.user_id,
    tm.role,
    COALESCE(au.email, 'Ukjent bruker') AS email
  FROM public.team_memberships tm
  LEFT JOIN auth.users au ON au.id = tm.user_id
  WHERE tm.team_id = ANY(p_team_ids)
    AND tm.status = 'active'
  ORDER BY
    tm.team_id,
    CASE tm.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'member' THEN 3
      ELSE 4
    END,
    au.email;
$$;

GRANT EXECUTE ON FUNCTION public.get_members_for_teams(uuid[]) TO authenticated;
