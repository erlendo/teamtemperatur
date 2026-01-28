-- Add DELETE policy for submissions
-- Allow team owners to delete submissions from their team members

DROP POLICY IF EXISTS "submissions_delete_by_owner" ON public.submissions;
CREATE POLICY "submissions_delete_by_owner"
ON public.submissions FOR DELETE
USING (
  public.team_role(team_id) = 'owner'
);

-- Also add DELETE policy for team_memberships if missing
DROP POLICY IF EXISTS "memberships_delete_if_owner" ON public.team_memberships;
CREATE POLICY "memberships_delete_if_owner"
ON public.team_memberships FOR DELETE
USING (
  public.team_role(team_id) = 'owner'
);
