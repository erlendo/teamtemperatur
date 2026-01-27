#!/usr/bin/env node
/**
 * Run Supabase migration directly using service role credentials
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Load env vars
require('dotenv').config({ path: '.env.local' })

async function runMigration() {
  // Extract database URL from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗')
    process.exit(1)
  }

  // Extract project ref from URL: https://PROJECT_REF.supabase.co
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

  if (!projectRef) {
    console.error(
      '❌ Could not extract project ref from NEXT_PUBLIC_SUPABASE_URL'
    )
    process.exit(1)
  }

  // Construct database connection string
  // Using direct connection with IPv6 support
  const connectionString = `postgresql://postgres:${serviceRoleKey}@db.${projectRef}.supabase.co:5432/postgres`

  console.log('🔄 Connecting to Supabase database...')
  console.log('📦 Project:', projectRef)

  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/005_drafts_and_year_stats.sql'
    )
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('🔄 Running migration: 005_drafts_and_year_stats.sql')

    await client.query(sql)

    console.log('✅ Migration completed successfully!')
    console.log('')
    console.log('📋 Created:')
    console.log('   - Table: tt_drafts')
    console.log('   - Function: get_team_year_stats()')
    console.log('   - RLS policies for drafts')
  } catch (err) {
    console.error('❌ Migration failed:')
    console.error(err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
