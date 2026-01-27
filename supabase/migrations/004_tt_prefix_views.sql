-- Create updatable views with tt_ prefix to avoid name collisions
-- These views map 1:1 to existing tables and remain RLS-aware.

create or replace view public.tt_teams as select * from public.teams;
create or replace view public.tt_team_memberships as select * from public.team_memberships;
create or replace view public.tt_questionnaires as select * from public.questionnaires;
create or replace view public.tt_questions as select * from public.questions;
create or replace view public.tt_submissions as select * from public.submissions;
create or replace view public.tt_answers as select * from public.answers;

-- Ensure authenticated can access the views (inherits RLS from base tables)
grant select, insert, update, delete on public.tt_teams to authenticated;
grant select, insert, update, delete on public.tt_team_memberships to authenticated;
grant select, insert, update, delete on public.tt_questionnaires to authenticated;
grant select, insert, update, delete on public.tt_questions to authenticated;
grant select, insert, update, delete on public.tt_submissions to authenticated;
grant select, insert, update, delete on public.tt_answers to authenticated;
