-- Fix security definer views to use security invoker instead
-- This ensures views enforce RLS policies of the querying user, not the view creator
-- Addresses Supabase linter warning: security_definer_view

-- Drop and recreate views with explicit SECURITY INVOKER
drop view if exists public.tt_teams;
drop view if exists public.tt_team_memberships;
drop view if exists public.tt_questionnaires;
drop view if exists public.tt_questions;
drop view if exists public.tt_submissions;
drop view if exists public.tt_answers;

-- Recreate views with explicit SECURITY INVOKER (the default, but being explicit)
create view public.tt_teams with (security_invoker=true) as 
  select * from public.teams;

create view public.tt_team_memberships with (security_invoker=true) as 
  select * from public.team_memberships;

create view public.tt_questionnaires with (security_invoker=true) as 
  select * from public.questionnaires;

create view public.tt_questions with (security_invoker=true) as 
  select * from public.questions;

create view public.tt_submissions with (security_invoker=true) as 
  select * from public.submissions;

create view public.tt_answers with (security_invoker=true) as 
  select * from public.answers;

-- Re-grant permissions (inherits RLS from base tables)
grant select, insert, update, delete on public.tt_teams to authenticated;
grant select, insert, update, delete on public.tt_team_memberships to authenticated;
grant select, insert, update, delete on public.tt_questionnaires to authenticated;
grant select, insert, update, delete on public.tt_questions to authenticated;
grant select, insert, update, delete on public.tt_submissions to authenticated;
grant select, insert, update, delete on public.tt_answers to authenticated;
