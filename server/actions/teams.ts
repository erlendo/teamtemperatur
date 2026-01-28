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

  // Get members for each team
  const teamsWithMembers = await Promise.all(
    (data ?? []).map(async (r: any) => {
      // Get members with emails via database function
      const { data: membersData, error: membersError } = await supabase.rpc(
        'get_team_members_with_emails',
        { p_team_id: r.teams.id }
      )

      if (membersError) {
        console.error(
          `Error fetching members for team ${r.teams.name}:`,
          membersError
        )
      }

      return {
        id: r.teams.id as string,
        name: r.teams.name as string,
        role: r.role as string,
        memberCount: membersData?.length || 0,
        members: membersData || [],
      }
    })
  )

  return teamsWithMembers
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

export async function removeMember(
  teamId: string,
  memberId: string,
  deleteSubmissions: boolean
) {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return { error: 'Ikke autentisert' }
  }

  // Verify caller is team owner
  const { data: callerRole, error: roleError } = await supabase.rpc(
    'team_role',
    { p_team_id: teamId }
  )

  if (roleError || callerRole !== 'owner') {
    console.error('[removeMember] Auth check failed:', {
      roleError,
      callerRole,
    })
    return { error: 'Du har ikke tillatelse til å fjerne medlemmer' }
  }

  console.log('[removeMember] Removing member:', {
    teamId,
    memberId,
    deleteSubmissions,
  })

  // Delete submissions if requested
  if (deleteSubmissions) {
    console.log('[removeMember] Deleting submissions...')
    const { error: submissionError, count } = await supabase
      .from('submissions')
      .delete()
      .eq('team_id', teamId)
      .eq('submitted_by', memberId)
      .select()

    console.log('[removeMember] Submissions deleted:', count)
    if (submissionError) {
      console.error('Error deleting submissions:', submissionError)
      return { error: 'Kunne ikke slette tidligere svar' }
    }
  }

  // Remove member from team
  console.log('[removeMember] Deleting membership...')
  const { error: deleteError, count: memberCount } = await supabase
    .from('tt_team_memberships')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', memberId)
    .select()

  console.log('[removeMember] Memberships deleted:', memberCount)
  if (deleteError) {
    console.error('Error removing member:', deleteError)
    return { error: 'Kunne ikke fjerne medlem' }
  }

  console.log('[removeMember] Success!')
  return { success: true }
}

export async function getUsersWithSubmissions(teamId: string) {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return { error: 'Ikke autentisert' }
  }

  // Verify caller is team owner
  const { data: callerRole, error: roleError } = await supabase.rpc(
    'team_role',
    { p_team_id: teamId }
  )

  if (roleError || callerRole !== 'owner') {
    console.error('[getUsersWithSubmissions] Not owner:', {
      roleError,
      callerRole,
    })
    return { error: 'Du har ikke tillatelse til å se denne informasjonen' }
  }

  console.log('[getUsersWithSubmissions] Calling RPC for teamId:', teamId)
  const { data, error } = await supabase.rpc('get_users_with_submissions', {
    p_team_id: teamId,
  })

  console.log('[getUsersWithSubmissions] RPC response:', {
    error,
    dataLength: Array.isArray(data) ? data.length : typeof data,
  })

  if (error) {
    console.error('[getUsersWithSubmissions] RPC Error:', error)
    return { error: `RPC error: ${error.message}` }
  }

  if (!Array.isArray(data)) {
    console.error('[getUsersWithSubmissions] Data is not an array:', data)
    return { error: 'Invalid response from database' }
  }

  return { data }
}

export async function deleteUserSubmissions(teamId: string, userId: string) {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return { error: 'Ikke autentisert' }
  }

  // Verify caller is team owner
  const { data: callerRole, error: roleError } = await supabase.rpc(
    'team_role',
    { p_team_id: teamId }
  )

  if (roleError || callerRole !== 'owner') {
    return { error: 'Du har ikke tillatelse til å slette besvarelser' }
  }

  console.log('[deleteUserSubmissions] Deleting submissions:', {
    teamId,
    userId,
  })

  const { error: deleteError, count } = await supabase
    .from('submissions')
    .delete()
    .eq('team_id', teamId)
    .eq('submitted_by', userId)
    .select()

  console.log('[deleteUserSubmissions] Submissions deleted:', count)
  if (deleteError) {
    console.error('[deleteUserSubmissions] Error:', deleteError)
    return { error: 'Kunne ikke slette besvarelser' }
  }

  return { success: true, count }
}
