-- Fix for get_users_with_submissions
-- Remove auth.users join which may have RLS permission issues
-- We'll fallback to user_id since auth.users may not be accessible

CREATE OR REPLACE FUNCTION public.get_users_with_submissions(p_team_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  submission_count bigint,
  latest_submission timestamp with time zone,
  is_current_member boolean,
  member_role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_submissions AS (
    SELECT 
      s.submitted_by as user_id,
      COUNT(s.id) as submission_count,
      MAX(s.submitted_at) as latest_submission
    FROM public.submissions s
    WHERE s.team_id = p_team_id
    GROUP BY s.submitted_by
  )
  SELECT 
    us.user_id,
    COALESCE(au.email, us.user_id::text) as email,
    us.submission_count,
    us.latest_submission,
    EXISTS(
      SELECT 1 FROM public.team_memberships tm 
      WHERE tm.team_id = p_team_id 
        AND tm.user_id = us.user_id 
        AND tm.status = 'active'
    ) as is_current_member,
    (
      SELECT tm.role FROM public.team_memberships tm 
      WHERE tm.team_id = p_team_id 
        AND tm.user_id = us.user_id 
        AND tm.status = 'active'
      LIMIT 1
    ) as member_role
  FROM user_submissions us
  LEFT JOIN auth.users au ON au.id = us.user_id
  ORDER BY 
    is_current_member DESC,
    us.latest_submission DESC;
$$;
