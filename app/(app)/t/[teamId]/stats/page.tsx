import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getTeamById } from '@/server/actions/teams';
import { notFound } from 'next/navigation';
import { getTeamYearStats } from '@/server/actions/stats';
import { YearStatsView } from '@/components/YearStatsView';
import { getOrGenerateWeeklySummary } from '@/server/actions/ai';
import { AISummary } from '@/components/AISummary';

export const revalidate = 0;

type PageProps = {
  params: { teamId: string };
  searchParams: { year?: string };
};

export default async function Page({ params, searchParams }: PageProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const team = await getTeamById(params.teamId);
  if (!team) {
    return notFound();
  }

  const year = searchParams.year ? parseInt(searchParams.year, 10) : new Date().getFullYear();
  const teamYearStats = await getTeamYearStats(team.id, year);

  let weeklySummary = '';
  // Vi henter/genererer kun for den siste uken med data
  if (teamYearStats.weeklyStats.length > 0) {
    const latestWeek = teamYearStats.weeklyStats[0]; // Forutsatt synkende sortering

    const summaryData = {
      motivation: latestWeek.averages['Motivasjon'] ?? 0,
      workload: latestWeek.averages['Arbeidsmengde'] ?? 0,
      wellbeing: latestWeek.averages['Trivsel'] ?? 0,
    };

    weeklySummary = await getOrGenerateWeeklySummary(
      team.id,
      year,
      latestWeek.week_number,
      summaryData
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">
          Statistikk for {team.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          År: {year}
        </p>
      </div>

      <AISummary summary={weeklySummary} />

      <YearStatsView
        teamId={team.id}
        currentYear={year}
        weeklyStats={teamYearStats.weeklyStats}
        questions={teamYearStats.questionLabels}
      />
    </div>
  );
}
