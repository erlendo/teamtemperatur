-- Fix: Allow all team members to read team membership list
-- Problem: Only owners/admins (or self) can SELECT team_memberships, so non-admins cannot resolve teammate profiles
-- Solution: Permit SELECT for any active team member of the team

BEGIN;

DROP POLICY IF EXISTS "memberships_select" ON public.team_memberships;

CREATE POLICY "memberships_select"
  ON public.team_memberships FOR SELECT
  USING (
    public.is_team_member(team_id)
  );

COMMIT;
