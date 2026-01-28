import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const sql = readFileSync(
  'supabase/migrations/007_team_members_with_emails.sql',
  'utf-8'
)

// Execute SQL via raw query
const statements = sql.split(';').filter((s) => s.trim())

for (const statement of statements) {
  if (statement.trim()) {
    const { error } = await supabase.rpc('exec', { sql: statement })
    if (error) {
      console.error('Statement failed:', statement.substring(0, 100), error)
    } else {
      console.log('✓', statement.substring(0, 60).replace(/\n/g, ' '))
    }
  }
}

console.log('\n✅ Migration complete')
