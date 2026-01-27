'use server'

import { supabaseServer } from '@/lib/supabase/server'

type WeekStatRow = {
  question_key: string
  question_label: string
  sort_order: number
  avg_score: number
  n_answers: number
}

type QuestionStat = {
  question_key: string
  question_label: string
  sort_order: number
  avg_score: number
  count: number
}

type WeekStat = {
  week: number
  overall_avg: number
  response_count: number
  member_count: number
  response_rate: number
  question_stats: QuestionStat[]
}

export async function getWeekStats(teamId: string, week: number) {
  const supabase = supabaseServer()
  const { data, error } = await supabase.rpc('get_team_week_stats', {
    p_team_id: teamId,
    p_week: week,
  })
  if (error) throw error
  return data as WeekStatRow[]
}

export async function getYearStats(
  teamId: string,
  currentWeek?: number
): Promise<WeekStat[]> {
  const supabase = supabaseServer()
  const { data, error } = await supabase.rpc('get_team_year_stats', {
    p_team_id: teamId,
    p_current_week: currentWeek ?? null,
  })

  if (error) throw error
  return (data ?? []) as WeekStat[]
}
