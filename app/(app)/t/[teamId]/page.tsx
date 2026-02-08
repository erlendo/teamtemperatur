import { AppHeader } from '@/components/AppHeader'
import { DashboardSection } from '@/components/DashboardSection'
import { HealthCard } from '@/components/HealthCard'
import { supabaseServer } from '@/lib/supabase/server'
import { getTeamItems } from '@/server/actions/dashboard'
import { getYearStats } from '@/server/actions/stats'
import Link from 'next/link'

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

  // Fetch team members with email lookup
  const supabase = supabaseServer()
  const { data: members } = await supabase
    .from('team_memberships')
    .select('user_id')
    .eq('team_id', teamId)
    .eq('status', 'active')

  // Get user emails from auth.users via admin API
  let userEmails: Record<string, string> = {}
  if (members && members.length > 0) {
    try {
      const userIds = members.map((m) => m.user_id)
      // Query to get user emails
      const { data } = await supabase.auth.admin.listUsers()
      const users = data?.users || []
      userEmails = users
        .filter((u) => userIds.includes(u.id))
        .reduce(
          (acc, u) => {
            acc[u.id] = u.email || u.id
            return acc
          },
          {} as Record<string, string>
        )
    } catch (err) {
      console.error('Error fetching user emails:', err)
    }
  }

  const teamMembers =
    (members as Array<{ user_id: string }> | null)
      ?.map((m) => ({
        id: m.user_id,
        email: userEmails[m.user_id] || m.user_id.slice(0, 8) + '...',
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
      <AppHeader teamId={teamId} />
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

          {/* Row 2: Helse | Retro */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: 'var(--space-2xl)',
              marginBottom: 'var(--space-2xl)',
            }}
          >
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
