-- Add INSTEAD OF triggers for view operations to properly respect RLS
-- Views don't support RLS directly, so we need triggers to enforce policies

-- DELETE trigger for tt_team_memberships
DROP TRIGGER IF EXISTS tt_team_memberships_delete ON public.tt_team_memberships;
DROP FUNCTION IF EXISTS public.tt_team_memberships_delete_handler();

CREATE OR REPLACE FUNCTION public.tt_team_memberships_delete_handler()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if current user is owner of this team
  IF (SELECT public.team_role(OLD.team_id)) != 'owner' THEN
    RAISE EXCEPTION 'Only team owners can delete members';
  END IF;

  DELETE FROM public.team_memberships
  WHERE team_id = OLD.team_id AND user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER tt_team_memberships_delete
INSTEAD OF DELETE ON public.tt_team_memberships
FOR EACH ROW
EXECUTE FUNCTION public.tt_team_memberships_delete_handler();

-- Also ensure DELETE policy exists on actual table as fallback
DROP POLICY IF EXISTS "memberships_delete_if_owner" ON public.team_memberships;
CREATE POLICY "memberships_delete_if_owner"
ON public.team_memberships FOR DELETE
USING (
  public.team_role(team_id) = 'owner'
);
