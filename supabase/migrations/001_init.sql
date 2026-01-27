-- Minimal schema + RLS for multi-team temperature app
create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_memberships (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  status text not null default 'active' check (status in ('active','invited')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  version int not null default 1,
  is_active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires(id) on delete cascade,
  key text not null,
  label text not null,
  type text not null check (type in ('scale_1_5','yes_no','text')),
  required boolean not null default true,
  weight numeric not null default 1,
  sort_order int not null default 0,
  meta jsonb not null default '{}'::jsonb
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  questionnaire_id uuid not null references public.questionnaires(id),
  week int not null,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  display_name text,
  is_anonymous boolean not null default true
);

create unique index if not exists submissions_unique_week_per_user
  on public.submissions(team_id, week, submitted_by);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  value_num numeric,
  value_bool boolean,
  value_text text
);

create index if not exists answers_submission_idx on public.answers(submission_id);
create index if not exists submissions_team_week_idx on public.submissions(team_id, week);

-- Helper functions (created after tables exist)
create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = p_team_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
  );
$$;

create or replace function public.team_role(p_team_id uuid)
returns text
language sql
stable
as $$
  select tm.role
  from public.team_memberships tm
  where tm.team_id = p_team_id
    and tm.user_id = auth.uid()
    and tm.status = 'active'
  limit 1;
$$;

-- RLS
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;
alter table public.questionnaires enable row level security;
alter table public.questions enable row level security;
alter table public.submissions enable row level security;
alter table public.answers enable row level security;

drop policy if exists "teams_select_if_member" on public.teams;
create policy "teams_select_if_member"
on public.teams for select
using (public.is_team_member(id));

drop policy if exists "teams_insert_authenticated" on public.teams;
create policy "teams_insert_authenticated"
on public.teams for insert
with check (created_by = auth.uid());

drop policy if exists "teams_update_if_admin" on public.teams;
create policy "teams_update_if_admin"
on public.teams for update
using (public.team_role(id) in ('owner','admin'));

drop policy if exists "memberships_select" on public.team_memberships;
create policy "memberships_select"
on public.team_memberships for select
using (
  (user_id = auth.uid())
  or (public.team_role(team_id) in ('owner','admin'))
);

drop policy if exists "memberships_update_if_admin" on public.team_memberships;
create policy "memberships_update_if_admin"
on public.team_memberships for update
using (public.team_role(team_id) in ('owner','admin'));

drop policy if exists "memberships_insert_if_admin" on public.team_memberships;
create policy "memberships_insert_if_admin"
on public.team_memberships for insert
with check (public.team_role(team_id) in ('owner','admin'));

drop policy if exists "questionnaires_select_if_member" on public.questionnaires;
create policy "questionnaires_select_if_member"
on public.questionnaires for select
using (public.is_team_member(team_id));

drop policy if exists "questionnaires_write_if_admin" on public.questionnaires;
create policy "questionnaires_write_if_admin"
on public.questionnaires for all
using (public.team_role(team_id) in ('owner','admin'))
with check (public.team_role(team_id) in ('owner','admin'));

drop policy if exists "questions_select_if_member" on public.questions;
create policy "questions_select_if_member"
on public.questions for select
using (
  exists (
    select 1
    from public.questionnaires q
    where q.id = questionnaire_id
      and public.is_team_member(q.team_id)
  )
);

drop policy if exists "questions_write_if_admin" on public.questions;
create policy "questions_write_if_admin"
on public.questions for all
using (
  exists (
    select 1
    from public.questionnaires q
    where q.id = questionnaire_id
      and public.team_role(q.team_id) in ('owner','admin')
  )
)
with check (
  exists (
    select 1
    from public.questionnaires q
    where q.id = questionnaire_id
      and public.team_role(q.team_id) in ('owner','admin')
  )
);

drop policy if exists "submissions_select_own" on public.submissions;
create policy "submissions_select_own"
on public.submissions for select
using (submitted_by = auth.uid());

drop policy if exists "submissions_insert_own" on public.submissions;
create policy "submissions_insert_own"
on public.submissions for insert
with check (submitted_by = auth.uid() and public.is_team_member(team_id));

drop policy if exists "answers_select_own" on public.answers;
create policy "answers_select_own"
on public.answers for select
using (
  exists (
    select 1
    from public.submissions s
    where s.id = submission_id
      and s.submitted_by = auth.uid()
  )
);

drop policy if exists "answers_insert_own" on public.answers;
create policy "answers_insert_own"
on public.answers for insert
with check (
  exists (
    select 1
    from public.submissions s
    where s.id = submission_id
      and s.submitted_by = auth.uid()
  )
);

-- Aggregated stats RPC (members can call; reads through RLS via security definer, but checks membership)
create or replace function public.get_team_week_stats(p_team_id uuid, p_week int)
returns table (
  question_key text,
  avg_score numeric,
  n_answers int
)
language sql
security definer
as $$
  select qu.key as question_key,
         avg(a.value_num) as avg_score,
         count(*) as n_answers
  from public.submissions s
  join public.answers a on a.submission_id = s.id
  join public.questions qu on qu.id = a.question_id
  where s.team_id = p_team_id
    and s.week = p_week
    and public.is_team_member(p_team_id)
    and qu.type = 'scale_1_5'
  group by qu.key
  order by qu.key;
$$;

revoke all on function public.get_team_week_stats(uuid,int) from public;
grant execute on function public.get_team_week_stats(uuid,int) to authenticated;
