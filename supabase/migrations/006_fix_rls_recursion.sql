-- Fix recursive RLS policy stack overflow
-- Make helper functions SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER  -- Add this to bypass RLS
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships tm
    WHERE tm.team_id = p_team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.team_role(p_team_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER  -- Add this to bypass RLS
SET search_path = public
AS $$
  SELECT tm.role
  FROM public.team_memberships tm
  WHERE tm.team_id = p_team_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  LIMIT 1;
$$;
