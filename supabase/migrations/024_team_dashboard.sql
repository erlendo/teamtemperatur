-- Team Dashboard Tables
-- Supports ukemål, pipeline, mål, retro with shared structure:
-- text + person tags + system tags + status

-- Item types enum
create type public.team_item_type as enum ('ukemål', 'pipeline', 'mål', 'retro');

-- Item status enum
create type public.team_item_status as enum ('planlagt', 'pågår', 'ferdig');

-- Main items table
create table public.team_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  type public.team_item_type not null,
  title text not null,
  status public.team_item_status default 'planlagt',
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Person tags (team members assigned to items)
create table public.team_item_members (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.team_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(item_id, user_id)
);

-- System tags (lowercase, max 5 per item enforced in app)
create table public.team_item_tags (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.team_items(id) on delete cascade,
  tag_name text not null,
  created_at timestamptz default now(),
  unique(item_id, tag_name)
);

-- Indexes for performance
create index team_items_team_id_idx on public.team_items(team_id);
create index team_items_type_idx on public.team_items(type);
create index team_item_members_item_id_idx on public.team_item_members(item_id);
create index team_item_members_user_id_idx on public.team_item_members(user_id);
create index team_item_tags_item_id_idx on public.team_item_tags(item_id);
create index team_item_tags_tag_name_idx on public.team_item_tags(tag_name);

-- RPC: Get tag suggestions for a team (by frequency)
create or replace function public.get_team_tag_suggestions(p_team_id uuid)
returns table (
  tag_name text,
  usage_count bigint
)
language sql
security definer
as $$
  select 
    tit.tag_name,
    count(*) as usage_count
  from public.team_item_tags tit
  join public.team_items ti on ti.id = tit.item_id
  where ti.team_id = p_team_id
  group by tit.tag_name
  order by usage_count desc, tit.tag_name asc;
$$;

-- Row Level Security
alter table public.team_items enable row level security;
alter table public.team_item_members enable row level security;
alter table public.team_item_tags enable row level security;

-- Policies for team_items
create policy "Team members can view team items"
  on public.team_items for select
  using (public.is_team_member(team_id));

create policy "Team members can insert team items"
  on public.team_items for insert
  with check (public.is_team_member(team_id));

create policy "Team members can update team items"
  on public.team_items for update
  using (public.is_team_member(team_id));

create policy "Team members can delete team items"
  on public.team_items for delete
  using (public.is_team_member(team_id));

-- Policies for team_item_members
create policy "Team members can view item members"
  on public.team_item_members for select
  using (
    exists (
      select 1 from public.team_items ti
      where ti.id = team_item_members.item_id
      and public.is_team_member(ti.team_id)
    )
  );

create policy "Team members can insert item members"
  on public.team_item_members for insert
  with check (
    exists (
      select 1 from public.team_items ti
      where ti.id = team_item_members.item_id
      and public.is_team_member(ti.team_id)
    )
  );

create policy "Team members can delete item members"
  on public.team_item_members for delete
  using (
    exists (
      select 1 from public.team_items ti
      where ti.id = team_item_members.item_id
      and public.is_team_member(ti.team_id)
    )
  );

-- Policies for team_item_tags
create policy "Team members can view item tags"
  on public.team_item_tags for select
  using (
    exists (
      select 1 from public.team_items ti
      where ti.id = team_item_tags.item_id
      and public.is_team_member(ti.team_id)
    )
  );

create policy "Team members can insert item tags"
  on public.team_item_tags for insert
  with check (
    exists (
      select 1 from public.team_items ti
      where ti.id = team_item_tags.item_id
      and public.is_team_member(ti.team_id)
    )
  );

create policy "Team members can delete item tags"
  on public.team_item_tags for delete
  using (
    exists (
      select 1 from public.team_items ti
      where ti.id = team_item_tags.item_id
      and public.is_team_member(ti.team_id)
    )
  );

-- Grant permissions
grant execute on function public.get_team_tag_suggestions(uuid) to authenticated;
grant all on public.team_items to authenticated;
grant all on public.team_item_members to authenticated;
grant all on public.team_item_tags to authenticated;
