import { AppHeader } from '@/components/AppHeader'
import { HealthCard } from '@/components/HealthCard'
import { supabaseServer } from '@/lib/supabase/server'
import { getAllTeamRelations, getTeamItems } from '@/server/actions/dashboard'
import { getYearStats } from '@/server/actions/stats'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DashboardClient } from './client'

function getISOWeekInfo(): {
  week: number
  year: number
  start: Date
  end: Date
} {
  const now = new Date()

  // ISO 8601: Week 1 is the week with the first Thursday of the year
  // Or equivalently: the first week with a Monday on or after January 4
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const dayOfWeek = jan4.getDay()
  // Monday = 1, Sunday = 0 in getDay(), but we need Monday = 1, Sunday = 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

  // Calculate week number from Monday of week 1
  const timeDiff = now.getTime() - monday.getTime()
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
  const week = Math.floor(daysDiff / 7) + 1

  // Get Monday of current week (Norway: week starts Monday)
  const dayInWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // Monday = 0
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - dayInWeek)
  startDate.setHours(0, 0, 0, 0)

  // Get Sunday of current week
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  endDate.setHours(23, 59, 59, 999)

  return {
    week,
    year: now.getFullYear(),
    start: startDate,
    end: endDate,
  }
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
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

  const { data: team } = await supabase
    .from('teams')
    .select('name')
    .eq('id', teamId)
    .maybeSingle()

  const teamName = team?.name ?? undefined

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

  // Fetch all relations in one batch query
  const { relations: allRelations } = await getAllTeamRelations(teamId)

  // Fetch health stats
  const weekInfo = getISOWeekInfo()
  const currentWeek = weekInfo.week
  const statsData = await getYearStats(teamId, currentWeek)
  const currentWeekStats = statsData?.find((s) => s.week === currentWeek)
  const previousWeekStats = statsData?.find((s) => s.week === currentWeek - 1)

  return (
    <>
      <AppHeader
        teamId={teamId}
        teamName={teamName}
        isTeamAdmin={isTeamAdmin}
      />
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
            Dashboard – Uke {weekInfo.week} ({formatDate(weekInfo.start)}–
            {formatDate(weekInfo.end)})
          </h1>

          {/* Row 1: Ukemål | Pipeline | Mål (with cross-column linking) */}
          <DashboardClient
            ukemålItems={ukemålItems}
            pipelineItems={pipelineItems}
            målItems={målItems}
            retroItems={retroItems}
            allRelations={allRelations}
            teamId={teamId}
            teamMembers={teamMembers}
            userRole={userRole}
          />

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
