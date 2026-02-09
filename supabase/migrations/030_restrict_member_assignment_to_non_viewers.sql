-- Update RLS policy for team_item_members INSERT to restrict viewers from assigning
-- Viewers should be read-only and cannot assign members to tasks

DROP POLICY IF EXISTS "Team members can manage item members" ON public.team_item_members;

CREATE POLICY "Team members can manage item members"
  ON public.team_item_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_members.item_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'member')  -- Viewers cannot assign
    )
  );
