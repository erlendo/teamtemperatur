import { AISummary } from '@/components/AISummary'
import { AppHeader } from '@/components/AppHeader'
import { YearStatsView } from '@/components/YearStatsView'
import { supabaseServer } from '@/lib/supabase/server'
import { getWeeklySummary } from '@/server/actions/ai'
import { getYearStats } from '@/server/actions/stats'
import { notFound } from 'next/navigation'

export const revalidate = 0

type PageProps = {
  params: { teamId: string }
  searchParams: { year?: string; week?: string }
}

export default async function Page({ params, searchParams }: PageProps) {
  const supabase = supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  const { data: team } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', params.teamId)
    .single()

  if (!team) {
    return notFound()
  }

  // Check user role for admin features
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', params.teamId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const isTeamOwner = membership?.role === 'owner'
  const isTeamAdmin = isTeamOwner || membership?.role === 'admin'

  const year = searchParams.year
    ? parseInt(searchParams.year, 10)
    : new Date().getFullYear()
  const currentWeek = Math.ceil(
    (new Date().getTime() - new Date(year, 0, 1).getTime()) / 604800000
  )
  const teamYearStats = await getYearStats(team.id, currentWeek)

  // Filter weeks with actual responses
  const weeksWithResponses = teamYearStats.filter(
    (w) =>
      w.response_count > 0 && w.question_stats && w.question_stats.length > 0
  )

  // Determine which week to show summary for
  let selectedWeek = null
  const requestedWeek = searchParams.week
    ? parseInt(searchParams.week, 10)
    : null

  if (requestedWeek) {
    // Use the requested week if it exists in the data
    selectedWeek = weeksWithResponses.find((w) => w.week === requestedWeek)
  }

  if (!selectedWeek && weeksWithResponses.length > 0) {
    // Fall back to the most recent week with responses
    selectedWeek = weeksWithResponses[weeksWithResponses.length - 1]
  }

  let weeklySummary = ''
  let summaryData:
    | {
        overallAvg: number
        bayesianAdjusted: number
        responseRate: number
        responseCount: number
        memberCount: number
        topQuestionLabel?: string
        topQuestionScore?: number
        bottomQuestionLabel?: string
        bottomQuestionScore?: number
      }
    | undefined

  if (selectedWeek) {
    const sortedQuestions = [...(selectedWeek.question_stats ?? [])].sort(
      (a, b) => a.avg_score - b.avg_score
    )
    const bottomQuestion = sortedQuestions[0]
    const topQuestion = sortedQuestions[sortedQuestions.length - 1]

    summaryData = {
      overallAvg: selectedWeek.overall_avg ?? 0,
      bayesianAdjusted: selectedWeek.bayesian_adjusted ?? 0,
      responseRate: selectedWeek.response_rate ?? 0,
      responseCount: selectedWeek.response_count ?? 0,
      memberCount: selectedWeek.member_count ?? 0,
      topQuestionLabel: topQuestion?.question_label,
      topQuestionScore: topQuestion?.avg_score,
      bottomQuestionLabel: bottomQuestion?.question_label,
      bottomQuestionScore: bottomQuestion?.avg_score,
    }

    weeklySummary = await getWeeklySummary(team.id, year, selectedWeek.week)
  }

  return (
    <>
      <AppHeader
        teamId={team.id}
        teamName={team.name}
        isTeamAdmin={isTeamAdmin}
      />
      <main style={{ flex: 1, backgroundColor: 'var(--color-neutral-50)' }}>
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: 'var(--space-3xl) var(--space-xl)',
            display: 'grid',
            gap: 'var(--space-2xl)',
          }}
        >
          <section
            style={{
              padding: 'var(--space-2xl)',
              borderRadius: '1.5rem',
              border: '1px solid var(--color-neutral-200)',
              background:
                'linear-gradient(180deg, var(--color-neutral-100), rgba(230, 239, 240, 0.72))',
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
              Teaminnsikt
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: 'var(--font-size-4xl)',
                fontWeight: 900,
                color: 'var(--color-neutral-900)',
                letterSpacing: '-0.02em',
              }}
            >
              Statistikk for {year}
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: '42rem',
                color: 'var(--color-neutral-600)',
                fontSize: 'var(--font-size-base)',
              }}
            >
              Følg utviklingen i teamhelse, deltakelse og spørsmålstrender med
              samme rolige farge- og informasjonsstruktur som resten av
              arbeidsflaten.
            </p>
          </section>

          <AISummary
            summary={weeklySummary}
            teamId={team.id}
            isTeamOwner={isTeamOwner}
            year={year}
            weekNumber={selectedWeek?.week}
            summaryData={summaryData}
          />

          <YearStatsView
            data={teamYearStats}
            teamId={team.id}
            selectedWeekNumber={selectedWeek?.week}
          />
        </div>
      </main>
    </>
  )
}
