-- Migration 040: Add 'external' role and 'include_in_stats' field
-- Purpose: Support external collaborators who can be tagged but optionally excluded from health stats
--
-- Changes:
-- 1. Add 'external' role to team_memberships role check constraint
-- 2. Add 'include_in_stats' boolean field (default true for existing roles, false for external)
-- 3. Update get_team_year_stats to filter by include_in_stats

-- ============================================================
-- 1. ADD 'external' ROLE TO CONSTRAINT
-- ============================================================

-- Drop existing constraint
ALTER TABLE public.team_memberships
  DROP CONSTRAINT IF EXISTS team_memberships_role_check;

-- Add new constraint with 'external' role
ALTER TABLE public.team_memberships
  ADD CONSTRAINT team_memberships_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'external'));

-- ============================================================
-- 2. ADD 'include_in_stats' FIELD
-- ============================================================

-- Add column with default true (existing members should be included)
ALTER TABLE public.team_memberships
  ADD COLUMN IF NOT EXISTS include_in_stats BOOLEAN NOT NULL DEFAULT true;

-- Create index for performance on stats queries
CREATE INDEX IF NOT EXISTS idx_team_memberships_include_in_stats
  ON public.team_memberships(team_id, status, include_in_stats);

-- ============================================================
-- 3. ADD TRIGGER TO AUTO-SET include_in_stats FOR EXTERNAL ROLE
-- ============================================================

-- Function to automatically set include_in_stats based on role
CREATE OR REPLACE FUNCTION public.set_include_in_stats_for_external()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is external and include_in_stats is not explicitly set, default to false
  IF NEW.role = 'external' AND (TG_OP = 'INSERT' OR OLD.role != 'external') THEN
    NEW.include_in_stats := COALESCE(NEW.include_in_stats, false);
  END IF;

  -- If role is NOT external, always set include_in_stats to true (enforce)
  IF NEW.role IN ('owner', 'admin', 'member', 'viewer') THEN
    NEW.include_in_stats := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_include_in_stats ON public.team_memberships;
CREATE TRIGGER trigger_set_include_in_stats
  BEFORE INSERT OR UPDATE OF role, include_in_stats
  ON public.team_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_include_in_stats_for_external();

-- ============================================================
-- 4. UPDATE get_team_year_stats TO FILTER BY include_in_stats
-- ============================================================

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
      AND include_in_stats = true  -- 🔥 NEW: Only count members included in stats
  ),
  -- Only generate weeks that have actual submissions
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
    WHERE q.type = 'scale'  -- Only include scale questions in stats
    GROUP BY aa.week
  ),
  weekly_responses AS (
    SELECT
      s.week,
      COUNT(DISTINCT s.user_id)::int AS response_count
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
      -- Overall average from scale questions only
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
    -- Bayesian adjustment: pull non-respondents toward neutral (3.0)
    CASE
      WHEN wa.member_count > 0 THEN
        ROUND(
          (wa.response_count * COALESCE(wa.overall_avg, 0) + (wa.member_count - wa.response_count) * 3.0) / wa.member_count,
          2
        )
      ELSE 0
    END AS bayesian_adjusted,
    -- Moving average (60% current, 30% last week, 10% two weeks ago)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_team_year_stats(uuid, int) TO authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON COLUMN public.team_memberships.include_in_stats IS
  'Whether this member should be included in health statistics. Always true for owner/admin/member/viewer, optional for external role.';

COMMENT ON FUNCTION public.set_include_in_stats_for_external() IS
  'Automatically sets include_in_stats based on role: false by default for external, always true for other roles.';
