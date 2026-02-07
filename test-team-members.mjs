import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hkmtdglonpsudfuhxcpk.supabase.co'
const serviceRoleKey = 'sb_secret_9aG4MUNe3lPQq5j0lX8pEg_apMWTUmK'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function test() {
  const teamId = 'dbbd1841-eee9-4091-968e-69b8b6214b8e'

  console.log('=== Team Members ===')
  const { data: members, error } = await supabase
    .from('team_memberships')
    .select('user_id, status')
    .eq('team_id', teamId)
    .eq('status', 'active')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Raw data:', members)
  console.log(`Found ${members?.length || 0} active members`)
  members?.forEach((m) => {
    console.log('  -', m.user_id)
  })
}

test().catch(console.error)
