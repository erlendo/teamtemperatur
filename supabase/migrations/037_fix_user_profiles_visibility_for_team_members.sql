-- Fix: Team members cannot see each other's first names in dashboard
-- Problem: The existing RLS policy on user_profiles is too restrictive or not working
-- Solution: Simplify the policy to allow all active team members to see profiles of their teammates

BEGIN;

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Team members can view each other's profiles" ON public.user_profiles;

-- Create a simpler, more reliable policy
-- Any authenticated user who shares at least one active team membership can see the profile
CREATE POLICY "Team members can view teammate profiles"
  ON public.user_profiles FOR SELECT
  USING (
    -- User can see their own profile
    auth.uid() = user_id
    OR
    -- User can see profiles of people they share a team with
    EXISTS (
      SELECT 1 
      FROM public.team_memberships tm1
      INNER JOIN public.team_memberships tm2 
        ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
        AND tm2.user_id = user_profiles.user_id
        AND tm1.status = 'active'
        AND tm2.status = 'active'
    )
  );

COMMIT;
