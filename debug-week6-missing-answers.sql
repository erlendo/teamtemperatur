-- Find which questions are missing answers for week 6 in NOKUT team

-- 1. All scale_1_5 questions that SHOULD exist
WITH nokut_questions AS (
  SELECT 
    q.id,
    q.key,
    q.label,
    q.sort_order
  FROM public.questions q
  JOIN public.questionnaires qn ON qn.id = q.questionnaire_id
  WHERE qn.team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
    AND qn.is_active = true
    AND q.type = 'scale_1_5'
),

-- 2. All submissions for week 6
week6_submissions AS (
  SELECT 
    s.id as submission_id,
    s.submitted_by,
    s.submitted_at
  FROM public.submissions s
  WHERE s.team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
    AND s.week = 6
),

-- 3. All answers given for week 6
week6_answers AS (
  SELECT DISTINCT
    a.question_id
  FROM public.answers a
  JOIN week6_submissions w6s ON w6s.submission_id = a.submission_id
)

-- 4. Show which questions are missing
SELECT 
  nq.key,
  nq.label,
  nq.sort_order,
  CASE 
    WHEN w6a.question_id IS NULL THEN '❌ MANGLER SVAR'
    ELSE '✅ Har svar'
  END as status
FROM nokut_questions nq
LEFT JOIN week6_answers w6a ON w6a.question_id = nq.id
ORDER BY nq.sort_order;

-- 5. Also show the count of answers per question for week 6
SELECT 
  q.key,
  q.label,
  q.sort_order,
  COUNT(a.id) as answer_count
FROM public.questions q
JOIN public.questionnaires qn ON qn.id = q.questionnaire_id
LEFT JOIN public.answers a ON a.question_id = q.id
LEFT JOIN public.submissions s ON s.id = a.submission_id AND s.week = 6
WHERE qn.team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
  AND qn.is_active = true
  AND q.type = 'scale_1_5'
GROUP BY q.id, q.key, q.label, q.sort_order
ORDER BY q.sort_order;
