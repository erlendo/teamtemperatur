-- Direct SQL query to check get_team_year_stats output for NOKUT week 6
SELECT 
  week,
  response_count,
  member_count,
  response_rate,
  jsonb_array_length(question_stats) as question_count,
  question_stats
FROM public.get_team_year_stats(
  'dbbd1841-eee9-4091-968e-69b8b6214b8e'::uuid
)
WHERE week = 6;
