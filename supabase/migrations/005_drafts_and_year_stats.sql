-- Draft table for autosave functionality
create table if not exists public.tt_drafts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  questionnaire_id uuid not null references public.questionnaires(id) on delete cascade,
  week int not null check (week >= 1 and week <= 53),
  user_id uuid not null,
  display_name text,
  is_anonymous boolean not null default true,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique (team_id, week, user_id)
);

-- Enable RLS
alter table public.tt_drafts enable row level security;

-- Policy: users can only read/write their own drafts
create policy "drafts_select_own" on public.tt_drafts
  for select using (user_id = auth.uid());

create policy "drafts_insert_own" on public.tt_drafts
  for insert with check (user_id = auth.uid());

create policy "drafts_update_own" on public.tt_drafts
  for update using (user_id = auth.uid());

create policy "drafts_delete_own" on public.tt_drafts
  for delete using (user_id = auth.uid());

-- Grant access
grant select, insert, update, delete on public.tt_drafts to authenticated;

create or replace function public.get_team_year_stats(
  p_team_id uuid,
  p_current_week int default null
)
returns table (
  week int,
  overall_avg numeric,
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
    where q.type = 'scale_1_5'
    group by aa.week
  ),
  weekly_submissions as (
    select
      s.week,
      count(distinct s.submitted_by)::int as respondents,
      avg(a.value_num) filter (where q.type = 'scale_1_5') as overall
    from public.submissions s
    join public.answers a on a.submission_id = s.id
    join public.questions q on q.id = a.question_id
    where s.team_id = p_team_id
      and s.week between v_start_week and v_current_week
    group by s.week
  )
  select
    ws.wk as week,
    coalesce(wsub.overall, 0) as overall_avg,
    coalesce(wsub.respondents, 0) as response_count,
    am.total as member_count,
    case when am.total > 0
      then round((coalesce(wsub.respondents, 0)::numeric / am.total) * 100, 1)
      else 0 end as response_rate,
    coalesce(qs.q_stats, '[]'::jsonb) as question_stats
  from week_series ws
  cross join active_members am
  left join weekly_submissions wsub on wsub.week = ws.wk
  left join question_stats qs on qs.week = ws.wk
  order by ws.wk;
end;
$$;

grant execute on function public.get_team_year_stats(uuid, int) to authenticated;
