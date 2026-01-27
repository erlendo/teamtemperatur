#!/usr/bin/env node
/**
 * Run Supabase migration using REST API and SQL execution
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables')
    process.exit(1)
  }

  // Read migration file and split into individual statements
  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/005_drafts_and_year_stats.sql'
  )
  const sqlContent = fs.readFileSync(migrationPath, 'utf8')

  // Split by semicolons but keep multi-line statements together
  const statements = sqlContent
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  console.log('🔄 Running migration: 005_drafts_and_year_stats.sql')
  console.log(`📊 Found ${statements.length} SQL statements`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';'

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: stmt }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error(`❌ Statement ${i + 1} failed:`, error.substring(0, 200))
        failCount++
      } else {
        successCount++
        console.log(`✅ Statement ${i + 1}/${statements.length}`)
      }
    } catch (err) {
      console.error(`❌ Statement ${i + 1} exception:`, err.message)
      failCount++
    }
  }

  console.log('')
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)

  if (failCount === 0) {
    console.log('')
    console.log('🎉 Migration completed successfully!')
  }
}

runMigration().catch(console.error)
