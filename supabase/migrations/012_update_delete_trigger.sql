-- Update the DELETE trigger to handle NULL properly
-- The previous version didn't explicitly check for NULL

DROP TRIGGER IF EXISTS tt_team_memberships_delete ON public.tt_team_memberships;
DROP FUNCTION IF EXISTS public.tt_team_memberships_delete_handler();

CREATE OR REPLACE FUNCTION public.tt_team_memberships_delete_handler()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the current user's role in this team
  SELECT public.team_role(OLD.team_id) INTO user_role;
  
  -- Check if current user is owner of this team
  IF user_role IS NULL OR user_role != 'owner' THEN
    RAISE EXCEPTION 'Only team owners can delete members from this team';
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
