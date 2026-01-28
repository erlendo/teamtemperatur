-- Test if is_team_member() function works
-- User: 7cace60d-1d0e-4032-90ca-ff13e5206f2a

SET LOCAL role TO postgres;

-- 1. Test is_team_member function manually
SELECT public.is_team_member('8ae767f5-4027-437e-ae75-d34b3769544c') as is_member_nokut;
SELECT public.is_team_member('02b2b967-bc94-4e4a-ac03-30c9fea8ed50') as is_member_fagsystemer;

-- 2. Check what team_role returns
SELECT public.team_role('8ae767f5-4027-437e-ae75-d34b3769544c') as role_nokut;
SELECT public.team_role('02b2b967-bc94-4e4a-ac03-30c9fea8ed50') as role_fagsystemer;

-- 3. Test if the policy logic would work
SELECT 
  t.id,
  t.name,
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = t.id
      AND tm.user_id = '7cace60d-1d0e-4032-90ca-ff13e5206f2a'
      AND tm.status = 'active'
  ) as should_see
FROM public.teams t;
