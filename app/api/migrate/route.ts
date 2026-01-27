import { supabaseServer } from '@/lib/supabase/server'
import { readFileSync } from 'fs'
import { NextResponse } from 'next/server'
import { join } from 'path'

export async function POST(request: Request) {
  // Security: Only allow in development or with secret token
  const authHeader = request.headers.get('authorization')
  const secretToken = process.env.MIGRATION_SECRET_TOKEN

  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${secretToken}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = supabaseServer()

    // Read migration file
    const migrationPath = join(
      process.cwd(),
      'supabase/migrations/005_drafts_and_year_stats.sql'
    )
    const sql = readFileSync(migrationPath, 'utf8')

    // Execute SQL
    const { data: _data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql,
    })

    if (error) {
      console.error('[Migration] Error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Migration 005_drafts_and_year_stats.sql executed successfully',
    })
  } catch (err) {
    console.error('[Migration] Exception:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
