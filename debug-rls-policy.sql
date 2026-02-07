-- Test RLS policy directly
-- This checks if the policy allows service role to insert

-- First, let's see what happens when auth.uid() is NULL (which happens with service role)
SELECT 
  (SELECT 1 FROM public.team_memberships
   WHERE team_memberships.team_id = '36e1bda7-34b9-4c0f-bd26-8c62ee4d3d05'
   AND team_memberships.user_id = auth.uid()
   AND team_memberships.status = 'active') as policy_check,
  auth.uid() as current_user_id;

-- The issue: auth.uid() is NULL with service role, so the policy fails
-- Solution: Service role key should bypass RLS entirely, but we need to verify the policy is correct
