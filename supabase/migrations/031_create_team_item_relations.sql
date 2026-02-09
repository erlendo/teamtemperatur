-- Create team_item_relations table for linking items across columns
-- Enforces: ukemål → pipeline (1-to-1), pipeline → mål (1-to-many)

CREATE TABLE IF NOT EXISTS public.team_item_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  source_item_id UUID NOT NULL REFERENCES public.team_items(id) ON DELETE CASCADE,
  target_item_id UUID NOT NULL REFERENCES public.team_items(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('next_step', 'part_of')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Enforce strict one-to-one for both directions:
  -- One source can only link to one target per relation_type
  -- One target can only be linked from one source per relation_type
  UNIQUE(source_item_id, relation_type),
  UNIQUE(target_item_id, relation_type)
);

-- Index for efficient lookups
CREATE INDEX idx_team_item_relations_team_id ON public.team_item_relations(team_id);
CREATE INDEX idx_team_item_relations_source ON public.team_item_relations(source_item_id);
CREATE INDEX idx_team_item_relations_target ON public.team_item_relations(target_item_id);

-- Enable RLS
ALTER TABLE public.team_item_relations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Team members (owner, admin, member) can SELECT relations for their team
CREATE POLICY "Team members can read item relations"
  ON public.team_item_relations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = team_item_relations.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- RLS Policy: Only owner, admin, member can INSERT (viewers cannot)
CREATE POLICY "Team members can create item relations"
  ON public.team_item_relations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = team_item_relations.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'member')
    )
  );

-- RLS Policy: Users can DELETE their own relations or any owner can delete
CREATE POLICY "Team members can delete item relations"
  ON public.team_item_relations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = team_item_relations.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'member')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.team_item_relations TO authenticated;
