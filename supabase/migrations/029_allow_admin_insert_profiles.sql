-- Migration 029: Allow admin/owner to insert user profiles for team members

BEGIN;

-- Allow team admins/owners to insert profiles for other team members
CREATE POLICY "Team admins can insert team member profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm1
      JOIN public.team_memberships tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = public.user_profiles.user_id
      AND tm1.status = 'active'
      AND tm2.status = 'active'
      AND tm1.role IN ('owner', 'admin')
    )
  );

COMMIT;
