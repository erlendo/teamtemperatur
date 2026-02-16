-- Fix: Allow authenticated users to see all teams
-- Problem: New users cannot discover existing teams to join because RLS blocks visibility
-- Solution: Change teams SELECT policy to allow all authenticated users to see team names and IDs
--           Data security is maintained by RLS on submissions, questionnaires, and other team data

drop policy if exists "teams_select_if_member" on public.teams;

create policy "teams_select_authenticated"
on public.teams for select
to authenticated
using (true);
