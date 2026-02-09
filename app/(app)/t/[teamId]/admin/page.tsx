import { AdminUserProfiles } from '@/components/AdminUserProfiles'
import { supabaseServer } from '@/lib/supabase/server'
import { getUsersWithSubmissions } from '@/server/actions/teams'
import { redirect } from 'next/navigation'
import AdminUsersWithSubmissions from './client'

export const dynamic = 'force-dynamic'

interface TeamMember {
  user_id: string
  email: string
  first_name?: string
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params

  try {
    const result = await getUsersWithSubmissions(teamId)

    if (result.error) {
      // Not authorized or other error
      console.error('[AdminPage] Error:', result.error)
      redirect(`/t/${teamId}`)
    }

    // Fetch team members with their profiles
    const supabase = supabaseServer()
    const { data: members } = await supabase
      .from('team_memberships')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('status', 'active')

    // Get user emails and first names
    let teamMembers: TeamMember[] = []
    if (members && members.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, first_name')

      const profileMap = new Map(
        (
          (profiles as Array<{ user_id: string; first_name: string }>) || []
        ).map((p) => [p.user_id, p.first_name])
      )

      // Get emails from auth users
      const { data } = await supabase.auth.admin.listUsers()
      const usersMap = new Map((data?.users || []).map((u) => [u.id, u.email]))

      teamMembers = members.map((m) => ({
        user_id: m.user_id,
        email: usersMap.get(m.user_id) || m.user_id,
        first_name: profileMap.get(m.user_id),
      }))
    }

    return (
      <div>
        <div
          style={{
            borderBottom: '1px solid #e0e0e0',
            padding: '1.5rem 2rem',
            backgroundColor: '#fff',
          }}
        >
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>
            Team Admin
          </h1>
        </div>

        {/* User Profiles Section */}
        <AdminUserProfiles teamId={teamId} teamMembers={teamMembers} />

        {/* Submissions Section */}
        <div
          style={{
            borderTop: '2px solid #e0e0e0',
            marginTop: '2rem',
          }}
        >
          <AdminUsersWithSubmissions
            teamId={teamId}
            initialUsers={result.data ?? []}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('[AdminPage] Unexpected error:', error)
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ color: '#d32f2f' }}>Feil</h1>
        <p>Kunne ikke laste admin-siden. Sjekk at:</p>
        <ul>
          <li>Du er eier av teamet</li>
          <li>Alle database-migrasjoner er kjørt</li>
        </ul>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>
          Feil: {error instanceof Error ? error.message : 'Ukjent feil'}
        </p>
      </div>
    )
  }
}
