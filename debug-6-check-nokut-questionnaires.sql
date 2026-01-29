-- Check all questionnaires for NOKUT team
SELECT 
  id,
  team_id,
  name,
  version,
  is_active,
  created_at
FROM public.questionnaires
WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
ORDER BY created_at DESC;
