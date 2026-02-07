import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function test() {
  // Get first item and team members
  const { data: items, error: itemErr } = await supabase
    .from('team_items')
    .select('*')
    .limit(1)

  if (itemErr) {
    console.error('Error fetching item:', itemErr)
    return
  }

  if (!items || items.length === 0) {
    console.error('No items found')
    return
  }

  const itemId = items[0].id
  const teamId = items[0].team_id
  console.log('Testing with item:', itemId, 'in team:', teamId)

  // Get team members
  const { data: members, error: membersErr } = await supabase
    .from('team_memberships')
    .select('user_id')
    .eq('team_id', teamId)
    .eq('status', 'active')
    .limit(1)

  if (membersErr) {
    console.error('Error fetching members:', membersErr)
    return
  }

  if (!members || members.length === 0) {
    console.error('No active members in this team')
    return
  }

  const userId = members[0].user_id
  console.log('Testing with member:', userId)

  // Try to insert
  console.log('\n=== Attempting INSERT ===')
  const { data, error } = await supabase
    .from('team_item_members')
    .insert({ item_id: itemId, user_id: userId })
    .select()

  if (error) {
    console.error('✗ Insert failed:')
    console.error('  Code:', error.code)
    console.error('  Message:', error.message)
    console.error('  Details:', error.details)
    console.error('  Hint:', error.hint)
  } else {
    console.log('✓ Insert succeeded:', data)
  }
}

test().catch(console.error)
