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
  bayesian_adjusted: number
  moving_average: number
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

  if (error) {
    console.error('[getYearStats] RPC ERROR:', error)
    throw error
  }

  // Parse the data and ensure question_stats is properly formatted
  const result = (data ?? []).map((week: unknown) => {
    const w = week as Record<string, unknown>
    const question_stats = w.question_stats

    let parsedQuestionStats: QuestionStat[] = []

    if (question_stats) {
      try {
        // If it's a string, parse it; if it's already an array/object, use it directly
        const parsed =
          typeof question_stats === 'string'
            ? JSON.parse(question_stats)
            : question_stats
        parsedQuestionStats = Array.isArray(parsed) ? parsed : []
      } catch (e) {
        console.error('[getYearStats] Parse error:', e)
        parsedQuestionStats = []
      }
    }

    return {
      week: w.week as number,
      overall_avg: w.overall_avg as number,
      bayesian_adjusted: w.bayesian_adjusted as number,
      moving_average: w.moving_average as number,
      response_count: w.response_count as number,
      member_count: w.member_count as number,
      response_rate: w.response_rate as number,
      question_stats: parsedQuestionStats,
    }
  }) as WeekStat[]

  return result
}
