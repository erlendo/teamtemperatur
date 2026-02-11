-- Allow many-to-one relations: multiple sources can point to same target
-- E.g.: multiple ukemål → 1 pipeline, multiple pipeline → 1 mål

-- We need to update the constraints to allow multiple items to target the same item
-- Keep: One source can only have one target (unique on source per relation_type)
-- Remove: One target can only have one source (this was too restrictive)

-- Create new table without the restrictive target UNIQUE constraint
CREATE TABLE IF NOT EXISTS public.team_item_relations_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  source_item_id UUID NOT NULL REFERENCES public.team_items(id) ON DELETE CASCADE,
  target_item_id UUID NOT NULL REFERENCES public.team_items(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('next_step', 'part_of')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Allow many relations TO the same target (e.g., multiple ukemål → 1 pipeline)
  -- But prevent duplicate relations from same source to same target
  UNIQUE(source_item_id, target_item_id, relation_type)
);

-- Copy data from old table
INSERT INTO public.team_item_relations_new 
  (id, team_id, source_item_id, target_item_id, relation_type, created_at, created_by)
SELECT id, team_id, source_item_id, target_item_id, relation_type, created_at, created_by
FROM public.team_item_relations;

-- Drop old table and rename new one
DROP TABLE public.team_item_relations;
ALTER TABLE public.team_item_relations_new RENAME TO team_item_relations;

-- Recreate indexes
CREATE INDEX idx_team_item_relations_team_id ON public.team_item_relations(team_id);
CREATE INDEX idx_team_item_relations_source ON public.team_item_relations(source_item_id);
CREATE INDEX idx_team_item_relations_target ON public.team_item_relations(target_item_id);

-- Recreate RLS
ALTER TABLE public.team_item_relations ENABLE ROW LEVEL SECURITY;

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

GRANT SELECT, INSERT, DELETE ON public.team_item_relations TO authenticated;
