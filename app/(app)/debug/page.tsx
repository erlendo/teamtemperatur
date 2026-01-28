import { supabaseServer } from '@/lib/supabase/server'

export default async function DebugPage() {
  const supabase = supabaseServer()

  const { data: user, error: userError } = await supabase.auth.getUser()

  // Get all teams
  const { data: allTeams, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  // Get all memberships for current user
  const { data: myMemberships, error: membershipsError } = await supabase
    .from('team_memberships')
    .select('*, teams(*)')
    .eq('user_id', user?.user?.id || '')

  // Test is_team_member function
  const { data: isMemberNokut, error: nokutError } = await supabase.rpc(
    'is_team_member',
    { p_team_id: '8ae767f5-4027-437e-ae75-d34b3769544c' }
  )

  const { data: isMemberFagsystemer, error: fagsystError } = await supabase.rpc(
    'is_team_member',
    { p_team_id: '02b2b967-bc94-4e4a-ac03-30c9fea8ed50' }
  )

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>Debug Info</h1>

      <h2>Current User</h2>
      <pre>{JSON.stringify(user?.user, null, 2)}</pre>
      {userError && (
        <pre style={{ color: 'red' }}>
          Error: {JSON.stringify(userError, null, 2)}
        </pre>
      )}

      <h2>All Teams in Database</h2>
      <pre>{JSON.stringify(allTeams, null, 2)}</pre>
      {teamsError && (
        <pre style={{ color: 'red' }}>
          Error: {JSON.stringify(teamsError, null, 2)}
        </pre>
      )}

      <h2>My Memberships (raw query)</h2>
      <pre>{JSON.stringify(myMemberships, null, 2)}</pre>
      {membershipsError && (
        <pre style={{ color: 'red' }}>
          Error: {JSON.stringify(membershipsError, null, 2)}
        </pre>
      )}

      <h2>is_team_member() Tests</h2>
      <div>NOKUT: {String(isMemberNokut)}</div>
      {nokutError && (
        <pre style={{ color: 'red' }}>
          Error: {JSON.stringify(nokutError, null, 2)}
        </pre>
      )}
      <div>Fagsystemer FT: {String(isMemberFagsystemer)}</div>
      {fagsystError && (
        <pre style={{ color: 'red' }}>
          Error: {JSON.stringify(fagsystError, null, 2)}
        </pre>
      )}
    </div>
  )
}
