-- Migration 026: Explicitly create team_items tables with detailed error checking
-- This migration addresses the issue where migration 025 may not have executed properly

-- First, check if tables already exist by trying to drop them
-- If they exist, we'll drop them and recreate from scratch
-- If they don't exist, we'll just create them fresh

BEGIN;

-- Drop existing objects if they exist (and be explicit about what we're doing)
DROP TABLE IF EXISTS public.team_item_tags CASCADE;
DROP TABLE IF EXISTS public.team_item_members CASCADE;
DROP TABLE IF EXISTS public.team_items CASCADE;

-- Create team_items table
CREATE TABLE public.team_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  type text not null default 'ukemål' check (type in ('ukemål', 'pipeline', 'mål', 'retro')),
  title text not null,
  status text default 'planlagt' check (status in ('planlagt', 'pågår', 'ferdig')),
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Create team_item_members table
CREATE TABLE public.team_item_members (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.team_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(item_id, user_id)
);

-- Create team_item_tags table
CREATE TABLE public.team_item_tags (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.team_items(id) on delete cascade,
  tag_name text not null,
  created_at timestamptz default now(),
  unique(item_id, tag_name)
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

-- Create RLS policies
CREATE POLICY "Team members can select team items"
  ON public.team_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = team_items.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can insert team items"
  ON public.team_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = team_items.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can update team items"
  ON public.team_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = team_items.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can delete team items"
  ON public.team_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = team_items.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- Policies for team_item_members
CREATE POLICY "Team members can select item members"
  ON public.team_item_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_members.item_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can manage item members"
  ON public.team_item_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_members.item_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can delete item members"
  ON public.team_item_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_members.item_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- Policies for team_item_tags
CREATE POLICY "Team members can select item tags"
  ON public.team_item_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_tags.item_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can manage item tags"
  ON public.team_item_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_tags.item_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can delete item tags"
  ON public.team_item_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_items ti
      JOIN public.team_memberships tm ON tm.team_id = ti.team_id
      WHERE ti.id = team_item_tags.item_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- Grant table access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_item_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_item_tags TO authenticated;

COMMIT;
