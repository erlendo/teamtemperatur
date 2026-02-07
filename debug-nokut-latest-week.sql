-- Check which questions are missing for the LATEST week with data

-- 1. Find the latest week with submissions
WITH latest_week AS (
  SELECT MAX(week) as week
  FROM public.submissions
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
),

-- 2. All scale_1_5 questions that SHOULD exist
nokut_questions AS (
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

-- 3. Questions that have answers in the latest week
latest_week_answers AS (
  SELECT DISTINCT
    a.question_id,
    COUNT(a.id) as answer_count
  FROM public.answers a
  JOIN public.submissions s ON s.id = a.submission_id
  JOIN latest_week lw ON lw.week = s.week
  WHERE s.team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
  GROUP BY a.question_id
)

-- 4. Show status for each question
SELECT 
  (SELECT week FROM latest_week) as week,
  nq.key,
  nq.label,
  nq.sort_order,
  COALESCE(lwa.answer_count, 0) as answer_count,
  CASE 
    WHEN lwa.question_id IS NULL THEN '❌ MANGLER'
    ELSE '✅ Har svar'
  END as status
FROM nokut_questions nq
LEFT JOIN latest_week_answers lwa ON lwa.question_id = nq.id
ORDER BY nq.sort_order;
