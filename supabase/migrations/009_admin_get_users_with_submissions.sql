-- Function to get all users who have submissions in a team
-- Including former members who are no longer in team_memberships
-- This allows team owners to see and clean up orphaned submissions

CREATE OR REPLACE FUNCTION public.get_users_with_submissions(p_team_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  submission_count bigint,
  latest_submission timestamp with time zone,
  is_current_member boolean,
  current_role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.user_id,
    COALESCE(au.email, 'Ukjent bruker') as email,
    COUNT(s.id) as submission_count,
    MAX(s.created_at) as latest_submission,
    EXISTS(
      SELECT 1 FROM public.team_memberships tm 
      WHERE tm.team_id = p_team_id 
        AND tm.user_id = s.user_id 
        AND tm.status = 'active'
    ) as is_current_member,
    (
      SELECT tm.role FROM public.team_memberships tm 
      WHERE tm.team_id = p_team_id 
        AND tm.user_id = s.user_id 
        AND tm.status = 'active'
      LIMIT 1
    ) as current_role
  FROM public.submissions s
  LEFT JOIN auth.users au ON au.id = s.user_id
  WHERE s.team_id = p_team_id
  GROUP BY s.user_id, au.email
  ORDER BY 
    is_current_member DESC,
    latest_submission DESC;
$$;

-- Grant execute permission to authenticated users
-- RLS will be enforced through the calling code (team_role check)
GRANT EXECUTE ON FUNCTION public.get_users_with_submissions(uuid) TO authenticated;
