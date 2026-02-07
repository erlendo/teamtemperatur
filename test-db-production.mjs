import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing env variables');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

console.log('Testing database access...\n');

// Test 1: Try to query team_items directly
console.log('1. Querying team_items:');
const { data: items, error: itemError } = await supabase
  .from('team_items')
  .select('id, team_id, title')
  .limit(3);

if (itemError) {
  console.error('  ❌ Error:', itemError.message, '(code: ' + itemError.code + ')');
} else {
  console.log('  ✓ Success! Found', items?.length || 0, 'items');
  if (items && items.length > 0) {
    console.log('  Sample:', items[0]);
  }
}

// Test 2: Try to query team_item_tags directly
console.log('\n2. Querying team_item_tags:');
const { data: tags, error: tagError } = await supabase
  .from('team_item_tags')
  .select('id, item_id, tag_name')
  .limit(3);

if (tagError) {
  console.error('  ❌ Error:', tagError.message, '(code: ' + tagError.code + ')');
} else {
  console.log('  ✓ Success! Found', tags?.length || 0, 'tags');
  if (tags && tags.length > 0) {
    console.log('  Sample:', tags[0]);
  }
}

// Test 3: Check if we can insert a tag (this will fail if RLS is blocking)
console.log('\n3. Testing insert on team_item_tags:');
const testInsert = await supabase
  .from('team_item_tags')
  .insert({
    item_id: '00000000-0000-0000-0000-000000000000',
    tag_name: 'test-tag-' + Date.now(),
  });

if (testInsert.error) {
  console.error('  ❌ Insert error:', testInsert.error.message, '(code: ' + testInsert.error.code + ')');
} else {
  console.log('  ✓ Insert succeeded (unexpected - test record should have failed)');
}

console.log('\nDone');
