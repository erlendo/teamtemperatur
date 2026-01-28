-- Function to get team members with their email addresses
-- This allows us to fetch auth.users data from the application tier

CREATE OR REPLACE FUNCTION public.get_team_members_with_emails(p_team_id uuid)
RETURNS TABLE (
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
    tm.user_id,
    tm.role,
    COALESCE(au.email, 'Ukjent bruker') as email
  FROM public.team_memberships tm
  LEFT JOIN auth.users au ON au.id = tm.user_id
  WHERE tm.team_id = p_team_id
    AND tm.status = 'active'
  ORDER BY 
    CASE tm.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'member' THEN 3
      ELSE 4
    END,
    au.email;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_team_members_with_emails(uuid) TO authenticated;
