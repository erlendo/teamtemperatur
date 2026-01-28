-- Test the updated get_team_year_stats function
-- Run this in Supabase SQL Editor

select * from get_team_year_stats('8ae767f5-4027-437e-ae75-d34b3769544c'::uuid);

-- This should now return 8 columns:
-- week, overall_avg, bayesian_adjusted, moving_average,
-- response_count, member_count, response_rate, question_stats
