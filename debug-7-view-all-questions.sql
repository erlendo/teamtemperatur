-- Check all questions in tt_questions view
SELECT 
  q.id,
  q.questionnaire_id,
  q.key,
  q.label,
  q.type,
  q.sort_order,
  qn.team_id,
  qn.name as questionnaire_name,
  qn.is_active
FROM public.tt_questions q
JOIN public.questionnaires qn ON qn.id = q.questionnaire_id
ORDER BY qn.team_id, q.sort_order;
