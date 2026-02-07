import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing env variables');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

// SQL to create the team_items tables
const sql = `
-- Create team_items table
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

-- Create team_item_members table
CREATE TABLE IF NOT EXISTS public.team_item_members (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.team_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(item_id, user_id)
);

-- Create team_item_tags table
CREATE TABLE IF NOT EXISTS public.team_item_tags (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.team_items(id) on delete cascade,
  tag_name text not null,
  created_at timestamptz default now(),
  unique(item_id, tag_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS team_items_team_id_idx ON public.team_items(team_id);
CREATE INDEX IF NOT EXISTS team_items_type_idx ON public.team_items(type);
CREATE INDEX IF NOT EXISTS team_item_members_item_id_idx ON public.team_item_members(item_id);
CREATE INDEX IF NOT EXISTS team_item_tags_item_id_idx ON public.team_item_tags(item_id);

-- Enable RLS
ALTER TABLE public.team_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_item_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_item_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "TeamMembers can view items" ON public.team_items;
CREATE POLICY "TeamMembers can view items"
  ON public.team_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = team_items.team_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  ));

DROP POLICY IF EXISTS "TeamMembers can insert items" ON public.team_items;
CREATE POLICY "TeamMembers can insert items"
  ON public.team_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = team_items.team_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  ));

DROP POLICY IF EXISTS "TeamMembers can update items" ON public.team_items;
CREATE POLICY "TeamMembers can update items"
  ON public.team_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = team_items.team_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  ));

-- Policies for team_item_tags
DROP POLICY IF EXISTS "TeamMembers can select tags" ON public.team_item_tags;
CREATE POLICY "TeamMembers can select tags"
  ON public.team_item_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.team_items ti
    JOIN public.team_memberships tm ON tm.team_id = ti.team_id
    WHERE ti.id = team_item_tags.item_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  ));

DROP POLICY IF EXISTS "TeamMembers can insert tags" ON public.team_item_tags;
CREATE POLICY "TeamMembers can insert tags"
  ON public.team_item_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_items ti
    JOIN public.team_memberships tm ON tm.team_id = ti.team_id
    WHERE ti.id = team_item_tags.item_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  ));

DROP POLICY IF EXISTS "TeamMembers can delete tags" ON public.team_item_tags;
CREATE POLICY "TeamMembers can delete tags"
  ON public.team_item_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.team_items ti
    JOIN public.team_memberships tm ON tm.team_id = ti.team_id
    WHERE ti.id = team_item_tags.item_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  ));

-- Policies for team_item_members (similar structure)
DROP POLICY IF EXISTS "TeamMembers can select item members" ON public.team_item_members;
CREATE POLICY "TeamMembers can select item members"
  ON public.team_item_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.team_items ti
    JOIN public.team_memberships tm ON tm.team_id = ti.team_id
    WHERE ti.id = team_item_members.item_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  ));

DROP POLICY IF EXISTS "TeamMembers can manage item members" ON public.team_item_members;
CREATE POLICY "TeamMembers can manage item members"
  ON public.team_item_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_items ti
    JOIN public.team_memberships tm ON tm.team_id = ti.team_id
    WHERE ti.id = team_item_members.item_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  ));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_item_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_item_tags TO authenticated;
`;

console.log('Attempting to execute SQL to create team_items tables...\n');

try {
  // Try executing via rpc if available
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: sql
  });

  if (error) {
    console.error('RPC exec_sql failed:', error.message);
    console.log('\nTrying alternative approach via Supabase client...\n');
    
    // Alternative: Try executing individual CREATE TABLE statements
    const statements = sql.split(';').filter((s) => s.trim());
    let successCount = 0;
    let failureCount = 0;

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;

      try {
        console.log(`Executing: ${trimmed.substring(0, 70)}...`);
        // We can't directly execute arbitrary SQL via the client
        console.log('  Note: Cannot execute via Supabase JS client');
      } catch (e) {
        console.error('  Error:', e instanceof Error ? e.message : String(e));
        failureCount++;
      }
    }
  } else {
    console.log('✓ SQL executed successfully via RPC');
    console.log('Response:', data);
  }
} catch (err) {
  console.error('Error:', err instanceof Error ? err.message : String(err));
}

// Verify tables exist
console.log('\n=== Verifying Tables ===\n');
const { data: items, error: itemsError } = await supabase
  .from('team_items')
  .select('id')
  .limit(1);

if (itemsError) {
  console.error('✗ team_items still does not exist:', itemsError.message);
  console.log('\nThe direct SQL execution did not work.');
  console.log('You may need to manually run the migration via Supabase Dashboard > SQL Editor');
} else {
  console.log('✓ team_items table now exists!');
}
