import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabase() {
  try {
    // Check how many teams exist (NOKUT team)
    const { data: nokutTeams } = await supabase.from('teams').select('id, name')

    console.log('Teams:', nokutTeams)

    // Get NOKUT team specifically
    const { data: nokut } = await supabase
      .from('teams')
      .select('id, name')
      .eq('id', 'dbbd1841-eee9-4091-968e-69b8b6214b8e')
      .single()

    console.log('NOKUT team:', nokut)

    if (nokut) {
      // Check items for this team
      const { data: items, error: itemsError } = await supabase
        .from('team_items')
        .select('*')
        .eq('team_id', nokut.id)

      console.log('Items error:', itemsError)
      console.log('Items count:', items?.length)
      console.log('Items:', items?.slice(0, 3))

      // Check table exists
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['team_items', 'team_item_tags'])

      console.log('Table info error:', tableError)
      console.log('Tables:', tableInfo)
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

checkDatabase()
