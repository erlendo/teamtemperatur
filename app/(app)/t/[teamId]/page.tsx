import { AppHeader } from '@/components/AppHeader'
import { DashboardSection } from '@/components/DashboardSection'
import { HealthCard } from '@/components/HealthCard'
import { supabaseServer } from '@/lib/supabase/server'
import { getTeamItems } from '@/server/actions/dashboard'
import { getYearStats } from '@/server/actions/stats'
import Link from 'next/link'
import { redirect } from 'next/navigation'

function currentWeekNumberSimple(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  return Math.ceil(diff / oneWeek)
}

export default async function TeamHome({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params

  // Get current user
  const supabase = supabaseServer()
  const { data: authUser, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser.user) {
    redirect('/login')
  }

  // Fetch user role
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', authUser.user.id)
    .eq('status', 'active')
    .maybeSingle()

  const userRole = membership?.role || 'viewer'
  const isTeamAdmin = userRole === 'owner' || userRole === 'admin'

  // Fetch team members with first names from user_profiles
  const { data: members } = await supabase
    .from('team_memberships')
    .select('user_id')
    .eq('team_id', teamId)
    .eq('status', 'active')

  // Get user first names from user_profiles
  const userFirstNames: Record<string, string> = {}
  if (members && members.length > 0) {
    try {
      const userIds = members.map((m) => m.user_id)
      // Query to get first names from user_profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, first_name')
        .in('user_id', userIds)

      profiles?.forEach((p) => {
        userFirstNames[p.user_id] = p.first_name
      })
    } catch (err) {
      console.error('Error fetching user profiles:', err)
    }
  }

  const teamMembers =
    (members as Array<{ user_id: string }> | null)
      ?.map((m) => ({
        id: m.user_id,
        firstName: userFirstNames[m.user_id] || m.user_id.slice(0, 8) + '...',
      }))
      .filter((m) => m.id) || []

  // Fetch dashboard items
  const { items } = await getTeamItems(teamId)
  const ukemålItems = items.filter((i) => i.type === 'ukemål')
  const pipelineItems = items.filter((i) => i.type === 'pipeline')
  const målItems = items.filter((i) => i.type === 'mål')
  const retroItems = items.filter((i) => i.type === 'retro')

  // Fetch health stats
  const currentWeek = currentWeekNumberSimple()
  const statsData = await getYearStats(teamId, currentWeek)
  const currentWeekStats = statsData?.find((s) => s.week === currentWeek)
  const previousWeekStats = statsData?.find((s) => s.week === currentWeek - 1)

  return (
    <>
      <AppHeader teamId={teamId} isTeamAdmin={isTeamAdmin} />
      <main style={{ flex: 1, backgroundColor: 'var(--color-neutral-50)' }}>
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: 'var(--space-3xl) var(--space-xl)',
          }}
        >
          <h1
            style={{
              margin: '0 0 var(--space-3xl) 0',
              fontSize: 'var(--font-size-4xl)',
              fontWeight: '900',
              color: 'var(--color-neutral-900)',
              letterSpacing: '-0.02em',
            }}
          >
            Dashboard – Uke {currentWeek}, {new Date().getFullYear()}
          </h1>

          {/* Row 1: Ukemål | Pipeline | (Mål moved here) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: 'var(--space-2xl)',
              marginBottom: 'var(--space-2xl)',
            }}
          >
            <DashboardSection
              title="Ukemål denne uka"
              type="ukemål"
              items={ukemålItems}
              teamId={teamId}
              teamMembers={teamMembers}
            />
            <DashboardSection
              title="Pipeline (neste 4 uker)"
              type="pipeline"
              items={pipelineItems}
              teamId={teamId}
              teamMembers={teamMembers}
            />
            <DashboardSection
              title={`Mål (T${Math.ceil((new Date().getMonth() + 1) / 4)} ${new Date().getFullYear()})`}
              type="mål"
              items={målItems}
              teamId={teamId}
              teamMembers={teamMembers}
            />
          </div>

          {/* Row 2: Helse (full width - prominent) */}
          <div style={{ marginBottom: 'var(--space-2xl)' }}>
            <div>
              <h2
                style={{
                  margin: 0,
                  marginBottom: 'var(--space-lg)',
                  fontSize: 'var(--font-size-xl, 1.25rem)',
                  fontWeight: 600,
                  color: '#10b981',
                  paddingBottom: 'var(--space-md)',
                  borderBottom: '3px solid #10b981',
                }}
              >
                Helse
              </h2>
              {currentWeekStats ? (
                <HealthCard
                  teamId={teamId}
                  currentWeek={currentWeek}
                  overallAvg={currentWeekStats.overall_avg || 0}
                  responseRate={currentWeekStats.response_rate || 0}
                  responseCount={currentWeekStats.response_count || 0}
                  memberCount={currentWeekStats.member_count || 0}
                  previousWeekAvg={previousWeekStats?.overall_avg}
                  statsData={statsData}
                />
              ) : (
                <p
                  style={{
                    color: 'var(--color-neutral-500)',
                    fontStyle: 'italic',
                  }}
                >
                  Ingen helse-data tilgjengelig ennå.{' '}
                  <Link href={`/t/${teamId}/survey`}>Send inn målinger</Link>
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Retro */}
          <div style={{ marginBottom: 'var(--space-2xl)' }}>
            <DashboardSection
              title="Retro-forbedringer"
              type="retro"
              items={retroItems}
              teamId={teamId}
              teamMembers={teamMembers}
            />
          </div>

          {/* Back Link */}
          <Link
            href="/teams"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              color: 'var(--color-primary)',
              fontWeight: '600',
              textDecoration: 'none',
              padding: 'var(--space-md) var(--space-lg)',
              marginTop: 'var(--space-xl)',
              transition: 'color 0.2s ease',
              fontSize: 'var(--font-size-base)',
            }}
          >
            ← Tilbake til teams
          </Link>
        </div>
      </main>
    </>
  )
}
