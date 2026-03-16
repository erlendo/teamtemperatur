import { AdminUserProfiles } from '@/components/AdminUserProfiles'
import { AppHeader } from '@/components/AppHeader'
import { supabaseServer } from '@/lib/supabase/server'
import { getUsersWithSubmissions } from '@/server/actions/teams'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AdminUsersWithSubmissions from './client'

export const dynamic = 'force-dynamic'

interface TeamMember {
  user_id: string
  email: string
  first_name?: string
  role: string
  include_in_stats: boolean
}

function isLikelyEmail(value: string | null | undefined): value is string {
  return Boolean(value && value.includes('@'))
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params

  const result = await getUsersWithSubmissions(teamId)

  if (result.error) {
    // Not authorized or other error
    console.error('[AdminPage] Error:', result.error)
    redirect(`/t/${teamId}`)
  }

  try {
    const supabase = supabaseServer()
    const { data: authUser, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser.user) {
      redirect('/login')
    }

    const { data: membership } = await supabase
      .from('team_memberships')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', authUser.user.id)
      .eq('status', 'active')
      .maybeSingle()

    const isTeamAdmin =
      membership?.role === 'owner' || membership?.role === 'admin'

    const { data: team } = await supabase
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .maybeSingle()

    const teamName = team?.name ?? undefined

    // Fetch team members with their profiles
    const { data: members } = await supabase
      .from('team_memberships')
      .select('user_id, role, include_in_stats')
      .eq('team_id', teamId)
      .eq('status', 'active')

    // Get user emails and first names
    let teamMembers: TeamMember[] = []
    if (members && members.length > 0) {
      const { data: memberEmails } = await supabase.rpc(
        'get_team_members_with_emails',
        { p_team_id: teamId }
      )

      const emailMap = new Map(
        (
          (memberEmails as Array<{ user_id: string; email: string }> | null) ||
          []
        )
          .filter((entry) => entry.user_id)
          .map((entry) => [entry.user_id, entry.email])
      )

      const userIds = members.map((member) => member.user_id)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, email')
        .in('user_id', userIds)

      const profileMap = new Map(
        (
          (profiles as Array<{
            user_id: string
            first_name: string | null
            email: string | null
          }>) || []
        ).map((p) => [p.user_id, p])
      )

      const roleOrder: Record<string, number> = {
        owner: 0,
        admin: 1,
        member: 2,
        viewer: 3,
        external: 4,
      }

      teamMembers = members
        .map((m) => {
          const profile = profileMap.get(m.user_id)
          const profileEmail = profile?.email || null
          const rpcEmail = emailMap.get(m.user_id) || null

          return {
            user_id: m.user_id,
            email:
              (isLikelyEmail(profileEmail) && profileEmail) ||
              (isLikelyEmail(rpcEmail) && rpcEmail) ||
              'Ukjent e-post',
            first_name: profile?.first_name || undefined,
            role: m.role,
            include_in_stats: m.include_in_stats,
          }
        })
        .sort((a, b) => {
          const roleDiff = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99)
          if (roleDiff !== 0) {
            return roleDiff
          }

          const aIdentity = a.first_name || a.email
          const bIdentity = b.first_name || b.email
          return aIdentity.localeCompare(bIdentity, 'nb', {
            sensitivity: 'base',
          })
        })
    }

    return (
      <>
        <AppHeader
          teamId={teamId}
          teamName={teamName}
          isTeamAdmin={isTeamAdmin}
        />
        <main style={{ flex: 1 }}>
          <div
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
              padding: 'var(--space-3xl) var(--space-md)',
              display: 'grid',
              gap: 'var(--space-2xl)',
            }}
          >
            <nav
              aria-label="Brødsmule"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-neutral-600)',
                marginBottom: 0,
              }}
            >
              <Link
                href={`/t/${teamId}`}
                style={{
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Teamoversikt
              </Link>
              <span aria-hidden="true">/</span>
              <span>Team Admin</span>
            </nav>

            <section
              style={{
                margin: 0,
                padding: 'var(--space-2xl)',
                borderRadius: '1.5rem',
                border: '1px solid var(--color-neutral-200)',
                background:
                  'linear-gradient(180deg, var(--color-neutral-100), rgba(243, 227, 211, 0.55))',
                boxShadow: 'var(--shadow-sm)',
                display: 'grid',
                gap: 'var(--space-sm)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-primary-dark)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Teamadministrasjon
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 800,
                  color: 'var(--color-neutral-900)',
                }}
              >
                Administrer team, medlemmer og historikk
              </h1>
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-neutral-600)',
                  fontSize: 'var(--font-size-base)',
                  maxWidth: '44rem',
                }}
              >
                Bruk adminflaten til å rydde i medlemsdata og historiske
                besvarelser uten at den visuelle retningen bryter med resten av
                produktet.
              </p>
            </section>

            {/* User Profiles Section */}
            <AdminUserProfiles teamId={teamId} teamMembers={teamMembers} />

            {/* Submissions Section */}
            <div
              style={{
                borderTop: '1px solid var(--color-neutral-200)',
                paddingTop: 'var(--space-2xl)',
              }}
            >
              <AdminUsersWithSubmissions
                teamId={teamId}
                initialUsers={result.data ?? []}
              />
            </div>
          </div>
        </main>
      </>
    )
  } catch (error) {
    console.error('[AdminPage] Unexpected error:', error)
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ color: 'var(--color-error-dark)' }}>Feil</h1>
        <p>Kunne ikke laste admin-siden. Sjekk at:</p>
        <ul>
          <li>Du er eier av teamet</li>
          <li>Alle database-migrasjoner er kjørt</li>
        </ul>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-neutral-600)',
          }}
        >
          Feil: {error instanceof Error ? error.message : 'Ukjent feil'}
        </p>
      </div>
    )
  }
}
