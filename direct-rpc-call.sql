-- Direct SQL call to get_team_year_stats to see actual output
SELECT 
  week,
  response_count,
  member_count,
  response_rate,
  jsonb_array_length(question_stats) as question_count
FROM public.get_team_year_stats(
  'dbbd1841-eee9-4091-968e-69b8b6214b8e'::uuid,
  6  -- Current week
)
WHERE week = 6;

-- Also check manual calculation for comparison
WITH submissions_week6 AS (
  SELECT DISTINCT submitted_by
  FROM public.submissions
  WHERE team_id = 'dbbd1841-eee9-4091-968e-69b8b6214b8e'
    AND week = 6
),
active_members AS (
  SELECT COUNT(*)::int as total
  FROM public.team_memberships
  WHERE team_id = 'dbbd1841-eee9-4091-968e-69b8b6214b8e'
    AND status = 'active'
)
SELECT 
  (SELECT COUNT(*) FROM submissions_week6) as respondents,
  (SELECT total FROM active_members) as members,
  ROUND(100.0 * (SELECT COUNT(*) FROM submissions_week6) / (SELECT total FROM active_members), 1) as response_rate_percent;
