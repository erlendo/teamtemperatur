-- Migration 041: Fix get_team_year_stats function
-- Bug fixes from migration 040:
-- 1. `s.user_id` → `s.submitted_by` in weekly_responses CTE (CRITICAL: submissions table has no user_id column)
-- 2. `q.type = 'scale'` → `q.type IN ('scale_1_5', 'scale')` (existing questions use scale_1_5 type)

CREATE OR REPLACE FUNCTION public.get_team_year_stats(
  p_team_id uuid,
  p_current_week int default null
)
RETURNS TABLE (
  week int,
  overall_avg numeric,
  bayesian_adjusted numeric,
  moving_average numeric,
  response_count int,
  member_count int,
  response_rate numeric,
  question_stats jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_week int;
  v_start_week int;
BEGIN
  IF NOT public.is_team_member(p_team_id) THEN
    RAISE EXCEPTION 'Not a team member';
  END IF;

  v_current_week := COALESCE(p_current_week, EXTRACT(week FROM now())::int);
  v_start_week := GREATEST(1, v_current_week - 51);

  RETURN QUERY
  WITH active_members AS (
    SELECT count(*)::int AS total
    FROM public.team_memberships
    WHERE team_id = p_team_id
      AND status = 'active'
      AND include_in_stats = true
  ),
  weeks_with_data AS (
    SELECT DISTINCT s.week AS wk
    FROM public.submissions s
    WHERE s.team_id = p_team_id
      AND s.week BETWEEN v_start_week AND v_current_week
  ),
  answers_agg AS (
    SELECT
      s.week,
      a.question_id,
      AVG(a.value_num) AS avg_score,
      COUNT(a.value_num) AS value_count
    FROM public.submissions s
    JOIN public.answers a ON a.submission_id = s.id
    WHERE s.team_id = p_team_id
      AND s.week BETWEEN v_start_week AND v_current_week
      AND a.value_num IS NOT NULL
    GROUP BY s.week, a.question_id
  ),
  question_agg AS (
    SELECT
      aa.week,
      jsonb_agg(
        jsonb_build_object(
          'question_key', q.key,
          'question_label', q.label,
          'sort_order', q.sort_order,
          'avg_score', ROUND(aa.avg_score, 2),
          'count', aa.value_count
        )
        ORDER BY q.sort_order
      ) AS question_stats
    FROM answers_agg aa
    JOIN public.questions q ON q.id = aa.question_id
    WHERE q.type IN ('scale_1_5', 'scale')
    GROUP BY aa.week
  ),
  weekly_responses AS (
    SELECT
      s.week,
      COUNT(DISTINCT s.submitted_by)::int AS response_count
    FROM public.submissions s
    WHERE s.team_id = p_team_id
      AND s.week BETWEEN v_start_week AND v_current_week
    GROUP BY s.week
  ),
  weekly_aggregates AS (
    SELECT
      w.wk AS week,
      am.total AS member_count,
      COALESCE(wr.response_count, 0) AS response_count,
      CASE
        WHEN am.total > 0 THEN ROUND((COALESCE(wr.response_count, 0)::numeric / am.total) * 100, 1)
        ELSE 0
      END AS response_rate,
      (
        SELECT ROUND(AVG((obj->>'avg_score')::numeric), 2)
        FROM jsonb_array_elements(COALESCE(qa.question_stats, '[]'::jsonb)) obj
      ) AS overall_avg,
      qa.question_stats
    FROM weeks_with_data w
    CROSS JOIN active_members am
    LEFT JOIN weekly_responses wr ON wr.week = w.wk
    LEFT JOIN question_agg qa ON qa.week = w.wk
  )
  SELECT
    wa.week,
    COALESCE(wa.overall_avg, 0) AS overall_avg,
    CASE
      WHEN wa.member_count > 0 THEN
        ROUND(
          (wa.response_count * COALESCE(wa.overall_avg, 0) + (wa.member_count - wa.response_count) * 3.0) / wa.member_count,
          2
        )
      ELSE 0
    END AS bayesian_adjusted,
    ROUND(
      0.6 * COALESCE(wa.overall_avg, 0) +
      0.3 * COALESCE(LAG(wa.overall_avg, 1) OVER (ORDER BY wa.week), COALESCE(wa.overall_avg, 0)) +
      0.1 * COALESCE(LAG(wa.overall_avg, 2) OVER (ORDER BY wa.week), COALESCE(wa.overall_avg, 0)),
      2
    ) AS moving_average,
    wa.response_count,
    wa.member_count,
    wa.response_rate,
    COALESCE(wa.question_stats, '[]'::jsonb) AS question_stats
  FROM weekly_aggregates wa
  ORDER BY wa.week;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_year_stats(uuid, int) TO authenticated;
