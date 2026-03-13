-- Allow only team owners to create, update, and delete AI weekly summaries.
-- Reading stays open to all team members via the existing select policy.

DROP POLICY IF EXISTS "Allow owners to manage summaries" ON public.ai_weekly_summaries;

CREATE POLICY "Allow owners to manage summaries"
ON public.ai_weekly_summaries
FOR ALL
TO authenticated
USING (public.team_role(team_id) = 'owner')
WITH CHECK (public.team_role(team_id) = 'owner');
