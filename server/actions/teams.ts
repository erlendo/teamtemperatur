'use server'

import { supabaseServer } from '@/lib/supabase/server'

export async function listMyTeams() {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return null // Return null when not authenticated
  }

  const { data, error } = await supabase
    .from('tt_team_memberships')
    .select('team_id, role, teams:team_id(id, name)')
    .eq('user_id', u.user.id)
    .eq('status', 'active')

  if (error) {
    console.error('listMyTeams error:', error)
    return []
  }

  return (data ?? []).map((r: any) => ({
    id: r.teams.id as string,
    name: r.teams.name as string,
    role: r.role as string,
  }))
}

export async function listAvailableTeams() {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return null // Return null when not authenticated
  }

  // Get all teams
  const { data: allTeams, error: allError } = await supabase
    .from('tt_teams')
    .select('id, name')

  if (allError) {
    console.error('listAvailableTeams allTeams error:', allError)
    return []
  }

  // Get user's team IDs
  const { data: userTeams, error: userError } = await supabase
    .from('tt_team_memberships')
    .select('team_id')
    .eq('user_id', u.user.id)
    .eq('status', 'active')

  if (userError) {
    console.error('listAvailableTeams userTeams error:', userError)
    return []
  }

  const userTeamIds = new Set((userTeams ?? []).map((t: any) => t.team_id))

  // Return teams the user is NOT a member of
  return (allTeams ?? []).filter((team: any) => !userTeamIds.has(team.id))
}

export async function joinTeam(teamId: string) {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return { error: 'Ikke autentisert' }
  }

  // Check if user is already a member
  const { data: existing } = await supabase
    .from('tt_team_memberships')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', u.user.id)
    .single()

  if (existing) {
    return { error: 'Du er allerede medlem av dette teamet' }
  }

  // Add user to team as member
  const { error: memErr } = await supabase.from('tt_team_memberships').insert({
    team_id: teamId,
    user_id: u.user.id,
    role: 'member',
    status: 'active',
  })

  if (memErr) {
    console.error('joinTeam error:', memErr)
    return { error: memErr.message }
  }

  return { success: true }
}

export async function createTeam(name: string) {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return { error: 'Ikke autentisert' }
  }

  console.log(
    '[createTeam] Creating team for user:',
    u.user.id,
    'with name:',
    name
  )

  const { data: team, error: teamErr } = await supabase
    .from('tt_teams')
    .insert({ name, created_by: u.user.id, settings: { teamSize: 6 } })
    .select()
    .single()
  if (teamErr) {
    console.error('[createTeam] Insert error:', {
      message: teamErr.message,
      code: teamErr.code,
      details: teamErr.details,
    })
    return { error: `Database error: ${teamErr.message}` }
  }

  console.log('[createTeam] Team created:', team.id)

  const { error: memErr } = await supabase.from('tt_team_memberships').insert({
    team_id: team.id,
    user_id: u.user.id,
    role: 'owner',
    status: 'active',
  })
  if (memErr) {
    console.error('createTeam membership error:', memErr)
    return { error: memErr.message }
  }

  console.log('[createTeam] Creating default questionnaire')

  // Create default questionnaire
  const { error: qErr } = await supabase.rpc('create_default_questionnaire', {
    p_team_id: team.id,
    p_created_by: u.user.id,
  })
  if (qErr) {
    console.error('[createTeam] Questionnaire creation error:', qErr)
    // Don't fail team creation if questionnaire fails
  }

  return { success: true, team }
}
