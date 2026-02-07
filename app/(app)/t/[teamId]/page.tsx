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
          <div
            style={{
              marginBottom: 'var(--space-3xl)',
              display: 'grid',
              gridTemplateColumns: '1fr 300px',
              gap: 'var(--space-2xl)',
              alignItems: 'start',
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 'var(--font-size-4xl)',
                fontWeight: '900',
                color: 'var(--color-neutral-900)',
                letterSpacing: '-0.02em',
              }}
            >
              Dashboard – Uke {currentWeek}, {new Date().getFullYear()}
            </h1>

            {/* Health Trend Chart */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-md)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid var(--color-neutral-200)',
              }}
            >
              <p
                style={{
                  margin: '0 0 var(--space-sm) 0',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-neutral-600)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Trend
              </p>
              <svg
                width="100%"
                height="60"
                viewBox="0 0 240 60"
                style={{ display: 'block' }}
              >
                {/* Grid background */}
                <line x1="0" y1="50" x2="240" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                
                {/* Sample trend data - this would come from statsData */}
                <polyline
                  points="0,40 60,35 120,25 180,30 240,15"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data points */}
                <circle cx="0" cy="40" r="3" fill="#10b981" />
                <circle cx="60" cy="35" r="3" fill="#10b981" />
                <circle cx="120" cy="25" r="3" fill="#10b981" />
                <circle cx="180" cy="30" r="3" fill="#10b981" />
                <circle cx="240" cy="15" r="3" fill="#10b981" />
              </svg>
              <p
                style={{
                  margin: 'var(--space-sm) 0 0 0',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-neutral-500)',
                  textAlign: 'center',
                }}
              >
                {currentWeekStats?.moving_average?.toFixed(1) || '—'} / 5.0
              </p>
            </div>
          </div>

          {/* Row 1: Ukemål | Pipeline */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
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
          </div>

          {/* Row 2: Mål | Helse */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
              gap: 'var(--space-2xl)',
              marginBottom: 'var(--space-2xl)',
            }}
          >
            <DashboardSection
              title={`Mål (Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()})`}
              type="mål"
              items={målItems}
              teamId={teamId}
              teamMembers={teamMembers}
            />
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

          {/* Row 3: Retro (full width) */}
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
