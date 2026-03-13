CREATE OR REPLACE FUNCTION public.get_team_year_binary_stats(
  p_team_id uuid,
  p_current_week int default null
)
RETURNS TABLE (
  week int,
  question_key text,
  question_label text,
  sort_order int,
  yes_count int,
  no_count int,
  response_count int,
  yes_rate numeric
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
  WITH included_submissions AS (
    SELECT s.week, a.question_id, a.value_bool
    FROM public.submissions s
    JOIN public.team_memberships tm
      ON tm.team_id = s.team_id
     AND tm.user_id = s.submitted_by
     AND tm.status = 'active'
     AND tm.include_in_stats = true
    JOIN public.answers a ON a.submission_id = s.id
    JOIN public.questions q ON q.id = a.question_id
    WHERE s.team_id = p_team_id
      AND s.week BETWEEN v_start_week AND v_current_week
      AND q.type = 'yes_no'
      AND a.value_bool IS NOT NULL
  )
  SELECT
    s.week,
    q.key AS question_key,
    q.label AS question_label,
    q.sort_order,
    COUNT(*) FILTER (WHERE s.value_bool IS TRUE)::int AS yes_count,
    COUNT(*) FILTER (WHERE s.value_bool IS FALSE)::int AS no_count,
    COUNT(*)::int AS response_count,
    ROUND(
      (
        COUNT(*) FILTER (WHERE s.value_bool IS TRUE)::numeric /
        NULLIF(COUNT(*)::numeric, 0)
      ) * 100,
      1
    ) AS yes_rate
  FROM included_submissions s
  JOIN public.questions q ON q.id = s.question_id
  GROUP BY s.week, q.key, q.label, q.sort_order
  ORDER BY s.week, q.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_year_binary_stats(uuid, int) TO authenticated;
