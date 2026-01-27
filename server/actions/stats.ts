'use server'

import { supabaseServer } from '@/lib/supabase/server'

type WeekStatRow = {
  question_key: string
  question_label: string
  sort_order: number
  avg_score: number
  n_answers: number
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
