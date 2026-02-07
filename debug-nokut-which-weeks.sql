-- Find which weeks have submissions for NOKUT team

-- 1. All weeks with submissions
SELECT 
  s.week,
  COUNT(DISTINCT s.id) as submission_count,
  COUNT(DISTINCT s.submitted_by) as unique_users,
  COUNT(DISTINCT a.question_id) as unique_questions_answered,
  MIN(s.submitted_at) as first_submission,
  MAX(s.submitted_at) as last_submission
FROM public.submissions s
LEFT JOIN public.answers a ON a.submission_id = s.id
WHERE s.team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
GROUP BY s.week
ORDER BY s.week DESC;

-- 2. Test current week in get_team_year_stats
SELECT 
  week,
  response_count,
  member_count,
  jsonb_array_length(question_stats) as question_count
FROM public.get_team_year_stats(
  '8ae767f5-4027-437e-ae75-d34b3769544c'::uuid,
  6  -- Current week
)
WHERE response_count > 0
ORDER BY week DESC
LIMIT 5;

-- 3. Check the actual current week
SELECT EXTRACT(WEEK FROM NOW())::int as current_week_number;

-- 4. Get latest week with data
SELECT MAX(week) as latest_week_with_data
FROM public.submissions
WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c';
