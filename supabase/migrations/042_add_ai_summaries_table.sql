create table public.ai_weekly_summaries (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    team_id uuid not null references public.teams(id) on delete cascade,
    year smallint not null,
    week_number smallint not null,
    summary text not null,
    model_used text,
    constraint ai_weekly_summaries_team_week_unique unique (team_id, year, week_number)
);

-- Enable RLS
alter table public.ai_weekly_summaries enable row level security;

-- Policies
create policy "Allow members to read summaries"
on public.ai_weekly_summaries for select
using ( public.is_team_member(team_id) );
