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

export type TertialItem = {
  id: string
  type: string
  title: string
  updated_at: string
  members: string[]
  tags: string[]
}

export type TertialReport = {
  year: number
  T1: TertialItem[]
  T2: TertialItem[]
  T3: TertialItem[]
}

export async function getTertialReport(
  teamId: string,
  year: number
): Promise<TertialReport> {
  const supabase = supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { year, T1: [], T2: [], T3: [] }

  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return { year, T1: [], T2: [], T3: [] }

  const start = `${year}-01-01`
  const end = `${year + 1}-01-01`

  const { data: items, error } = await supabase
    .from('team_items')
    .select('id, type, title, updated_at')
    .eq('team_id', teamId)
    .eq('type', 'ukemål')
    .eq('status', 'ferdig')
    .gte('updated_at', start)
    .lt('updated_at', end)
    .order('updated_at', { ascending: true })

  if (error) {
    console.error('[getTertialReport] error:', error)
    return { year, T1: [], T2: [], T3: [] }
  }

  if (!items || items.length === 0) {
    return { year, T1: [], T2: [], T3: [] }
  }

  const itemIds = items.map((i) => i.id)

  const [{ data: members }, { data: tags }] = await Promise.all([
    supabase
      .from('team_item_members')
      .select('item_id, user_id')
      .in('item_id', itemIds),
    supabase
      .from('team_item_tags')
      .select('item_id, tag_name')
      .in('item_id', itemIds),
  ])

  const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id)))
  const { data: profiles } = userIds.length
    ? await supabase
        .from('user_profiles')
        .select('user_id, first_name')
        .in('user_id', userIds)
    : { data: [] }

  const nameByUserId = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.first_name])
  )

  const mapped: TertialItem[] = items.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    updated_at: item.updated_at,
    members: (members ?? [])
      .filter((m) => m.item_id === item.id)
      .map((m) => nameByUserId.get(m.user_id) ?? '')
      .filter(Boolean),
    tags: (tags ?? [])
      .filter((t) => t.item_id === item.id)
      .map((t) => t.tag_name)
      .filter(Boolean),
  }))

  const byTertial = (start: number, end: number) =>
    mapped.filter((i) => {
      const month = new Date(i.updated_at).getMonth() + 1
      return month >= start && month <= end
    })

  return {
    year,
    T1: byTertial(1, 4),
    T2: byTertial(5, 8),
    T3: byTertial(9, 12),
  }
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
