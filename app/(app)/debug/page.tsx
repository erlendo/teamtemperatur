import { supabaseServer } from '@/lib/supabase/server'

export default async function DebugPage() {
  const supabase = supabaseServer()

  const { data: user } = await supabase.auth.getUser()

  // Get all teams (bypass RLS using service role if needed)
  const { data: allTeams } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  // Get all memberships for current user
  const { data: myMemberships } = await supabase
    .from('team_memberships')
    .select('*, teams(*)')
    .eq('user_id', user?.user?.id || '')

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Debug Info</h1>

      <h2>Current User</h2>
      <pre>{JSON.stringify(user?.user, null, 2)}</pre>

      <h2>All Teams in Database</h2>
      <pre>{JSON.stringify(allTeams, null, 2)}</pre>

      <h2>My Memberships</h2>
      <pre>{JSON.stringify(myMemberships, null, 2)}</pre>
    </div>
  )
}
