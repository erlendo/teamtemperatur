-- CRITICAL FIX: Create team_items tables in Supabase Production
-- Run this SQL directly in Supabase Dashboard > SQL Editor
-- This bypasses the migration system which appears to not be applying changes

BEGIN;

-- Drop enums if they exist (might be blocking table creation)
DROP TYPE IF EXISTS public.team_item_status CASCADE;
DROP TYPE IF EXISTS public.team_item_type CASCADE;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.team_item_tags CASCADE;
DROP TABLE IF EXISTS public.team_item_members CASCADE;
DROP TABLE IF EXISTS public.team_items CASCADE;

-- Create team_items table with TEXT types (not enums - more reliable)
CREATE TABLE public.team_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'ukemål' CHECK (type IN ('ukemål', 'pipeline', 'mål', 'retro')),
  title text NOT NULL,
  status text DEFAULT 'planlagt' CHECK (status IN ('planlagt', 'pågår', 'ferdig')),
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create team_item_members table
CREATE TABLE public.team_item_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.team_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, user_id)
);

-- Create team_item_tags table
CREATE TABLE public.team_item_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.team_items(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, tag_name)
);

-- Create indexes
CREATE INDEX team_items_team_id_idx ON public.team_items(team_id);
CREATE INDEX team_items_type_idx ON public.team_items(type);
CREATE INDEX team_item_members_item_id_idx ON public.team_item_members(item_id);
CREATE INDEX team_item_members_user_id_idx ON public.team_item_members(user_id);
CREATE INDEX team_item_tags_item_id_idx ON public.team_item_tags(item_id);
CREATE INDEX team_item_tags_tag_name_idx ON public.team_item_tags(tag_name);

-- Enable Row Level Security
ALTER TABLE public.team_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_item_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_item_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for team_items
CREATE POLICY "Users can select items from teams they're members of"
  ON public.team_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships
      WHERE team_memberships.team_id = team_items.team_id
        AND team_memberships.user_id = auth.uid()
        AND team_memberships.status = 'active'
    )
  );

CREATE POLICY "Users can insert items in teams they're members of"
  ON public.team_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_memberships
      WHERE team_memberships.team_id = team_items.team_id
        AND team_memberships.user_id = auth.uid()
        AND team_memberships.status = 'active'
    )
  );

CREATE POLICY "Users can update items in teams they're members of"
  ON public.team_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships
      WHERE team_memberships.team_id = team_items.team_id
        AND team_memberships.user_id = auth.uid()
        AND team_memberships.status = 'active'
    )
  );

CREATE POLICY "Users can delete items in teams they're members of"
  ON public.team_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships
      WHERE team_memberships.team_id = team_items.team_id
        AND team_memberships.user_id = auth.uid()
        AND team_memberships.status = 'active'
    )
  );

-- Create RLS Policies for team_item_tags
CREATE POLICY "Users can select tags for items in their teams"
  ON public.team_item_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      INNER JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_tags.item_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can add tags to items in their teams"
  ON public.team_item_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      INNER JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_tags.item_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can delete tags from items in their teams"
  ON public.team_item_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      INNER JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_tags.item_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

-- Create RLS Policies for team_item_members  
CREATE POLICY "Users can select members for items in their teams"
  ON public.team_item_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      INNER JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_members.item_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can add members to items in their teams"
  ON public.team_item_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      INNER JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_members.item_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can remove members from items in their teams"
  ON public.team_item_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      INNER JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_members.item_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_item_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_item_tags TO authenticated;

COMMIT;
