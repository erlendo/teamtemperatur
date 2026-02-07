import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing env variables');
  process.exit(1);
}

console.log('Connecting to:', url);

const supabase = createClient(url, serviceRoleKey);

console.log('\n=== Debugging Migration System ===\n');

// Check schema migrations table
console.log('1. Checking schema_migrations table:');
const { data: migrations, error: migError } = await supabase
  .from('schema_migrations')
  .select('*')
  .order('version', { ascending: false })
  .limit(5);

if (migError) {
  console.error('  Error accessing schema_migrations:', migError.message);
} else {
  console.log('  Latest 5 migrations:');
  if (migrations && migrations.length > 0) {
    migrations.forEach((m) => {
      console.log(`    v${String(m.version).padStart(3)}: ${m.name || 'unknown'}`);
    });
  } else {
    console.log('    No migrations found');
  }
}

// List all tables to see what actually exists
console.log('\n2. Checking all public tables:');
const { data: tables, error: tableError } = await supabase
  .rpc('get_all_tables', {});

if (tableError) {
  console.error('  RPC error:', tableError.message);
  
  // Try alternative approach - query information_schema directly
  console.log('  Trying information_schema query...');
  const result = await supabase.from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  if (result.error) {
    console.error('  Also failed:', result.error.message);
  } else if (result.data) {
    const names = result.data.map((t) => t.table_name);
    const hasTeamItems = names.includes('team_items');
    console.log('  Public tables:', names.length);
    console.log('  Has team_items?', hasTeamItems ? '✓ YES' : '✗ NO');
    const teamRelated = names.filter((n) => n.includes('team'));
    console.log('  Team-related tables:', teamRelated);
  }
} else if (tables) {
  console.log('  Tables:', tables);
}

console.log('\nDone');
