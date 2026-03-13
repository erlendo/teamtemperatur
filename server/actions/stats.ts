'use server'

import { supabaseServer } from '@/lib/supabase/server'
import {
  normalizeBinaryStatsRows,
  type BinaryWeekSignal,
  normalizeYearStatsRows,
  type WeekStat,
  type WeekStatRow,
} from '@/server/actions/stats.shared'

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

  return normalizeYearStatsRows(data ?? []) as WeekStat[]
}

export async function getYearBinaryStats(
  teamId: string,
  currentWeek?: number
): Promise<BinaryWeekSignal[]> {
  const supabase = supabaseServer()
  const { data, error } = await supabase.rpc('get_team_year_binary_stats', {
    p_team_id: teamId,
    p_current_week: currentWeek ?? null,
  })

  if (error) {
    console.error('[getYearBinaryStats] RPC ERROR:', error)
    throw error
  }

  return normalizeBinaryStatsRows(data ?? []) as BinaryWeekSignal[]
}
