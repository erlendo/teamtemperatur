-- Full analysis of NOKUT team questions

-- 1. Check how many questions exist in NOKUT's active questionnaire
SELECT 
  COUNT(*) as total_questions,
  COUNT(CASE WHEN type = 'scale_1_5' THEN 1 END) as scale_questions,
  COUNT(CASE WHEN type = 'yes_no' THEN 1 END) as yes_no_questions
FROM public.questions q
JOIN public.questionnaires qn ON qn.id = q.questionnaire_id
WHERE qn.team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
  AND qn.is_active = true;

-- 2. List all scale_1_5 questions for NOKUT with their keys and labels
SELECT 
  q.id,
  q.key,
  q.label,
  q.sort_order,
  q.weight,
  q.type
FROM public.questions q
JOIN public.questionnaires qn ON qn.id = q.questionnaire_id
WHERE qn.team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
  AND qn.is_active = true
  AND q.type = 'scale_1_5'
ORDER BY q.sort_order;

-- 3. Check if there are any answers for the scale_1_5 questions
SELECT 
  q.key,
  q.label,
  COUNT(DISTINCT a.id) as answer_count,
  COUNT(DISTINCT s.week) as weeks_with_answers
FROM public.questions q
JOIN public.questionnaires qn ON qn.id = q.questionnaire_id
LEFT JOIN public.answers a ON a.question_id = q.id
LEFT JOIN public.submissions s ON s.id = a.submission_id
WHERE qn.team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
  AND qn.is_active = true
  AND q.type = 'scale_1_5'
GROUP BY q.key, q.label, q.sort_order
ORDER BY q.sort_order;

-- 4. Check what get_team_year_stats returns for current week
SELECT * FROM public.get_team_year_stats(
  '8ae767f5-4027-437e-ae75-d34b3769544c'::uuid,
  (SELECT EXTRACT(WEEK FROM NOW())::int)
) 
WHERE week = (SELECT EXTRACT(WEEK FROM NOW())::int);
