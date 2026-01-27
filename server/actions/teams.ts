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
