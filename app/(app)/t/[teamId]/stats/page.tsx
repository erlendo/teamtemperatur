import { AISummary } from '@/components/AISummary'
import { AppHeader } from '@/components/AppHeader'
import { YearStatsView } from '@/components/YearStatsView'
import { supabaseServer } from '@/lib/supabase/server'
import { getOrGenerateWeeklySummary } from '@/server/actions/ai'
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

  const isTeamAdmin =
    membership?.role === 'owner' || membership?.role === 'admin'

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
  if (selectedWeek) {
    const sortedQuestions = [...(selectedWeek.question_stats ?? [])].sort(
      (a, b) => a.avg_score - b.avg_score
    )
    const bottomQuestion = sortedQuestions[0]
    const topQuestion = sortedQuestions[sortedQuestions.length - 1]

    const summaryData = {
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

    weeklySummary = await getOrGenerateWeeklySummary(
      team.id,
      year,
      selectedWeek.week,
      summaryData
    )
  }

  return (
    <>
      <AppHeader
        teamId={team.id}
        teamName={team.name}
        isTeamAdmin={isTeamAdmin}
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">
            Statistikk for {team.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">År: {year}</p>
        </div>

        <AISummary summary={weeklySummary} />

        <YearStatsView
          data={teamYearStats}
          teamId={team.id}
          selectedWeekNumber={selectedWeek?.week}
        />
      </div>
    </>
  )
}
