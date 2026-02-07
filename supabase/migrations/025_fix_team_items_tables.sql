-- Emergency fix: Recreate team_items if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  type text not null default 'ukemål',
  title text not null,
  status text default 'planlagt',
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);

CREATE TABLE IF NOT EXISTS public.team_item_members (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.team_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(item_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_item_tags (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.team_items(id) on delete cascade,
  tag_name text not null,
  created_at timestamptz default now(),
  unique(item_id, tag_name)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS team_items_team_id_idx ON public.team_items(team_id);
CREATE INDEX IF NOT EXISTS team_items_type_idx ON public.team_items(type);
CREATE INDEX IF NOT EXISTS team_item_members_item_id_idx ON public.team_item_members(item_id);
CREATE INDEX IF NOT EXISTS team_item_members_user_id_idx ON public.team_item_members(user_id);
CREATE INDEX IF NOT EXISTS team_item_tags_item_id_idx ON public.team_item_tags(item_id);
CREATE INDEX IF NOT EXISTS team_item_tags_tag_name_idx ON public.team_item_tags(tag_name);

-- Enable RLS
ALTER TABLE public.team_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_item_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_item_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
-- Note: In production Supabase, we should use CREATE POLICY IF NOT EXISTS syntax when available
-- For now, these will fail silently if they already exist, which is OK

DROP POLICY IF EXISTS "Team members can view team items" ON public.team_items;
CREATE POLICY "Team members can view team items"
  ON public.team_items for select
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships
      WHERE team_memberships.team_id = team_items.team_id
      AND team_memberships.user_id = auth.uid()
      AND team_memberships.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Team members can insert team items" ON public.team_items;
CREATE POLICY "Team members can insert team items"
  ON public.team_items for insert
  WITH CHECK (
    public.is_team_member(team_id)
  );

DROP POLICY IF EXISTS "Team members can update team items" ON public.team_items;
CREATE POLICY "Team members can update team items"
  ON public.team_items for update
  USING (public.is_team_member(team_id));

DROP POLICY IF EXISTS "Team members can delete team items" ON public.team_items;
CREATE POLICY "Team members can delete team items"
  ON public.team_items for delete
  USING (public.is_team_member(team_id));

-- team_item_members policies
DROP POLICY IF EXISTS "Team members can view item members" ON public.team_item_members;
CREATE POLICY "Team members can view item members"
  ON public.team_item_members for select
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      WHERE ti.id = team_item_members.item_id
      and public.is_team_member(ti.team_id)
    )
  );

DROP POLICY IF EXISTS "Team members can insert item members" ON public.team_item_members;
CREATE POLICY "Team members can insert item members"
  ON public.team_item_members for insert
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      WHERE ti.id = team_item_members.item_id
      and public.is_team_member(ti.team_id)
    )
  );

DROP POLICY IF EXISTS "Team members can delete item members" ON public.team_item_members;
CREATE POLICY "Team members can delete item members"
  ON public.team_item_members for delete
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      WHERE ti.id = team_item_members.item_id
      and public.is_team_member(ti.team_id)
    )
  );

-- team_item_tags policies
DROP POLICY IF EXISTS "Team members can view item tags" ON public.team_item_tags;
CREATE POLICY "Team members can view item tags"
  ON public.team_item_tags for select
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      WHERE ti.id = team_item_tags.item_id
      and public.is_team_member(ti.team_id)
    )
  );

DROP POLICY IF EXISTS "Team members can insert item tags" ON public.team_item_tags;
CREATE POLICY "Team members can insert item tags"
  ON public.team_item_tags for insert
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      WHERE ti.id = team_item_tags.item_id
      and public.is_team_member(ti.team_id)
    )
  );

DROP POLICY IF EXISTS "Team members can delete item tags" ON public.team_item_tags;
CREATE POLICY "Team members can delete item tags"
  ON public.team_item_tags for delete
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      WHERE ti.id = team_item_tags.item_id
      and public.is_team_member(ti.team_id)
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.team_item_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.team_item_tags TO authenticated;
