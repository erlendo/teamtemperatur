-- Add logging to understand why DELETE trigger fails
-- Replace trigger with version that logs what's happening

DROP TRIGGER IF EXISTS tt_team_memberships_delete ON public.tt_team_memberships;
DROP FUNCTION IF EXISTS public.tt_team_memberships_delete_handler();

CREATE OR REPLACE FUNCTION public.tt_team_memberships_delete_handler()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  user_role text;
  current_user_id uuid;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Log what we're trying to do
  RAISE NOTICE 'DELETE attempt: team_id=%, user_id=%, current_user=%, deleting_user=%', 
    OLD.team_id, OLD.user_id, current_user_id, OLD.user_id;
  
  -- Get the current user's role in this team
  SELECT public.team_role(OLD.team_id) INTO user_role;
  
  RAISE NOTICE 'Current user role in team: %', user_role;
  
  -- Check if current user is owner of this team
  IF user_role IS NULL OR user_role != 'owner' THEN
    RAISE EXCEPTION 'Only team owners can delete members from this team (your role: %)', user_role;
  END IF;

  RAISE NOTICE 'Proceeding with DELETE from team_memberships';
  
  DELETE FROM public.team_memberships
  WHERE team_id = OLD.team_id AND user_id = OLD.user_id;
  
  RAISE NOTICE 'DELETE completed successfully';
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER tt_team_memberships_delete
INSTEAD OF DELETE ON public.tt_team_memberships
FOR EACH ROW
EXECUTE FUNCTION public.tt_team_memberships_delete_handler();
