import { AppHeader } from '@/components/AppHeader'
import {
  BackToTeamLink,
  NewMeasurementButton,
} from '@/components/StatsPageLinks'
import { YearStatsView } from '@/components/YearStatsView'
import { supabaseServer } from '@/lib/supabase/server'
import { getYearStats } from '@/server/actions/stats'
import { BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

function currentWeekNumberSimple() {
  const d = new Date()
  const start = new Date(d.getFullYear(), 0, 1)
  const days = Math.floor((d.getTime() - start.getTime()) / 86400000)
  return Math.ceil((days + start.getDay() + 1) / 7)
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const currentWeek = currentWeekNumberSimple()

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

  let stats: Awaited<ReturnType<typeof getYearStats>> = []
  try {
    stats = await getYearStats(teamId, currentWeek)
  } catch (error) {
    console.error('Error fetching stats:', error)
    stats = []
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
            maxWidth: '1200px',
            margin: '0 auto',
            padding: 'var(--space-3xl) var(--space-md)',
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
              marginBottom: 'var(--space-lg)',
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
            <span>Statistikk</span>
          </nav>
          <h1
            style={{
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}
          >
            <BarChart3 size={28} />
            Statistikk
          </h1>

          {stats.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-3xl) var(--space-2xl)',
                textAlign: 'center',
                backgroundColor: 'white',
                border: '2px dashed var(--color-neutral-300)',
                borderRadius: 'var(--border-radius-lg)',
                marginTop: 'var(--space-2xl)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'var(--color-neutral-100)',
                  borderRadius: 'var(--border-radius-md)',
                  margin: '0 auto var(--space-lg)',
                  color: 'var(--color-neutral-400)',
                }}
              >
                <BarChart3 size={32} />
              </div>
              <h2
                style={{
                  marginBottom: 'var(--space-md)',
                  color: 'var(--color-neutral-900)',
                }}
              >
                Ingen data ennå
              </h2>
              <p
                style={{
                  color: 'var(--color-neutral-600)',
                  marginBottom: 'var(--space-xl)',
                  maxWidth: '500px',
                  margin: '0 auto var(--space-xl)',
                }}
              >
                Send inn din første måling for å se statistikk, trends og
                gjennomsnitt over tid.
              </p>
              <NewMeasurementButton teamId={teamId} />
            </div>
          ) : (
            <YearStatsView data={stats} />
          )}

          <div style={{ marginTop: 'var(--space-3xl)' }}>
            <BackToTeamLink teamId={teamId} />
          </div>
        </div>
      </main>
    </>
  )
}
