-- Fix: Include all scale questions in year stats, not just scale_1_5
-- Previously only scale_1_5 questions were returned in question_stats

create or replace function public.get_team_year_stats(
  p_team_id uuid,
  p_current_week int default null
)
returns table (
  week int,
  overall_avg numeric,
  bayesian_adjusted numeric,
  moving_average numeric,
  response_count int,
  member_count int,
  response_rate numeric,
  question_stats jsonb
)
language plpgsql
security definer
as $$
declare
  v_current_week int;
  v_start_week int;
begin
  if not public.is_team_member(p_team_id) then
    raise exception 'Not a team member';
  end if;

  v_current_week := coalesce(p_current_week, extract(week from now())::int);
  v_start_week := greatest(1, v_current_week - 51);

  return query
  with active_members as (
    select count(*)::int as total
    from public.team_memberships
    where team_id = p_team_id and status = 'active'
  ),
  week_series as (
    select generate_series(v_start_week, v_current_week) as wk
  ),
  answers_agg as (
    select
      s.week,
      a.question_id,
      avg(a.value_num) as avg_score,
      count(a.value_num) as value_count
    from public.submissions s
    join public.answers a on a.submission_id = s.id
    where s.team_id = p_team_id
      and s.week between v_start_week and v_current_week
    group by s.week, a.question_id
  ),
  question_stats as (
    select
      aa.week,
      jsonb_agg(
        jsonb_build_object(
          'question_key', q.key,
          'question_label', q.label,
          'sort_order', coalesce(q.sort_order, 0),
          'avg_score', aa.avg_score,
          'count', aa.value_count
        ) order by coalesce(q.sort_order, 0), q.key
      ) as q_stats
    from answers_agg aa
    join public.questions q on q.id = aa.question_id
    where q.type in ('scale_1_5', 'scale')
    group by aa.week
  ),
  weekly_submissions as (
    select
      s.week,
      count(distinct s.submitted_by)::int as respondents,
      avg(a.value_num) filter (where q.type in ('scale_1_5', 'scale')) as overall
    from public.submissions s
    join public.answers a on a.submission_id = s.id
    join public.questions q on q.id = a.question_id
    where s.team_id = p_team_id
      and s.week between v_start_week and v_current_week
    group by s.week
  ),
  bayesian_calc as (
    select
      ws.wk as week,
      am.total as member_count,
      coalesce(wsub.respondents, 0) as response_count,
      coalesce(wsub.overall, 0) as raw_score,
      case when am.total > 0
        then coalesce(wsub.respondents, 0)::numeric / am.total
        else 0 end as response_rate_decimal,
      -- Bayesian adjustment: (n * rawScore + k' * 3) / (n + k')
      -- where k' = 3 * (1 - responseRate) + 1
      case 
        when coalesce(wsub.respondents, 0) = 0 then 3.0
        else
          (
            coalesce(wsub.respondents, 0) * coalesce(wsub.overall, 0) +
            (3.0 * (1 - case when am.total > 0 then coalesce(wsub.respondents, 0)::numeric / am.total else 0 end) + 1) * 3.0
          ) / (
            coalesce(wsub.respondents, 0) +
            (3.0 * (1 - case when am.total > 0 then coalesce(wsub.respondents, 0)::numeric / am.total else 0 end) + 1)
          )
      end as bayesian_adjusted,
      coalesce(qs.q_stats, '[]'::jsonb) as q_stats
    from week_series ws
    cross join active_members am
    left join weekly_submissions wsub on wsub.week = ws.wk
    left join question_stats qs on qs.week = ws.wk
  ),
  moving_avg_calc as (
    select
      bc.week,
      bc.member_count,
      bc.response_count,
      bc.raw_score,
      bc.response_rate_decimal,
      bc.bayesian_adjusted,
      bc.q_stats,
      -- Moving average: 0.6 * current + 0.3 * prev + 0.1 * two_weeks_ago
      case
        when lag(bc.bayesian_adjusted, 1) over (order by bc.week) is null then bc.bayesian_adjusted
        when lag(bc.bayesian_adjusted, 2) over (order by bc.week) is null then
          0.6 * bc.bayesian_adjusted + 0.4 * lag(bc.bayesian_adjusted, 1) over (order by bc.week)
        else
          0.6 * bc.bayesian_adjusted +
          0.3 * lag(bc.bayesian_adjusted, 1) over (order by bc.week) +
          0.1 * lag(bc.bayesian_adjusted, 2) over (order by bc.week)
      end as moving_average
    from bayesian_calc bc
  )
  select
    mac.week,
    round(mac.raw_score, 2) as overall_avg,
    round(mac.bayesian_adjusted, 2) as bayesian_adjusted,
    round(mac.moving_average, 2) as moving_average,
    mac.response_count,
    mac.member_count,
    round(mac.response_rate_decimal * 100, 1) as response_rate,
    mac.q_stats as question_stats
  from moving_avg_calc mac
  order by mac.week;
end;
$$;

grant execute on function public.get_team_year_stats(uuid, int) to authenticated;
