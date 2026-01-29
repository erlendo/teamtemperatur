-- List all questions for NOKUT team
-- First find the active questionnaire, then list its questions

SELECT 
  q.id,
  q.key,
  q.label,
  q.type,
  q.required,
  q.weight,
  q.sort_order,
  qn.version,
  qn.is_active
FROM public.questions q
JOIN public.questionnaires qn ON qn.id = q.questionnaire_id
WHERE qn.team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
  AND qn.is_active = true
ORDER BY q.sort_order ASC;
