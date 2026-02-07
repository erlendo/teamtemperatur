import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Missing env variables')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey)

console.log('=== Checking Database Tables ===\n')

const tablesToCheck = [
  'teams',
  'users',
  'team_memberships',
  'team_items',
  'team_item_tags',
  'team_item_members',
  'questionnaires',
  'questions',
  'submissions',
  'answers',
  'schema_migrations',
  'supabase_migrations_locks',
]

for (const tableName of tablesToCheck) {
  const { data, error } = await supabase
    .from(tableName)
    .select('count')
    .limit(1)

  if (error) {
    const code = error.code || 'unknown'
    if (code === '42P01') {
      console.log(`✗ ${tableName.padEnd(25)} - does not exist (42P01)`)
    } else {
      console.log(`? ${tableName.padEnd(25)} - error: ${error.message}`)
    }
  } else {
    console.log(`✓ ${tableName.padEnd(25)} - exists`)
  }
}

console.log('\n=== Summary ===')
console.log('Tables starting with team_items should all exist.')
console.log("If they don't, the database schema is not initialized properly.")
