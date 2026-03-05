import { AISummary } from '@/components/AISummary'
import { YearStatsView } from '@/components/YearStatsView'
import { supabaseServer } from '@/lib/supabase/server'
import { getOrGenerateWeeklySummary } from '@/server/actions/ai'
import { getYearStats } from '@/server/actions/stats'
import { notFound } from 'next/navigation'

export const revalidate = 0

type PageProps = {
  params: { teamId: string }
  searchParams: { year?: string }
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

  const year = searchParams.year
    ? parseInt(searchParams.year, 10)
    : new Date().getFullYear()
  const currentWeek = Math.ceil(
    (new Date().getTime() - new Date(year, 0, 1).getTime()) / 604800000
  )
  const teamYearStats = await getYearStats(team.id, currentWeek)

  let weeklySummary = ''
  // Vi henter/genererer kun for den siste uken med data
  if (teamYearStats.length > 0) {
    const latestWeek = teamYearStats[teamYearStats.length - 1] // Siste uken i arrayet

    if (latestWeek) {
      // Extract question stats for summary
      const motivationStat = latestWeek.question_stats?.find(
        (q) => q.question_label === 'Motivasjon'
      )
      const workloadStat = latestWeek.question_stats?.find(
        (q) => q.question_label === 'Arbeidsmengde'
      )
      const wellbeingStat = latestWeek.question_stats?.find(
        (q) => q.question_label === 'Trivsel'
      )

      const summaryData = {
        motivation: motivationStat?.avg_score ?? 0,
        workload: workloadStat?.avg_score ?? 0,
        wellbeing: wellbeingStat?.avg_score ?? 0,
      }

      weeklySummary = await getOrGenerateWeeklySummary(
        team.id,
        year,
        latestWeek.week,
        summaryData
      )
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">
          Statistikk for {team.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">År: {year}</p>
      </div>

      <AISummary summary={weeklySummary} />

      <YearStatsView data={teamYearStats} />
    </div>
  )
}
