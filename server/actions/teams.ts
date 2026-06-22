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

  const rows = (data ?? []).map(
    (r) => r as unknown as { teams: { id: string; name: string }; role: string }
  )

  const teamIds = rows.map((r) => r.teams.id)

  // Fetch all members for all teams in a single batch call
  const { data: allMembers, error: membersError } = await supabase.rpc(
    'get_members_for_teams',
    { p_team_ids: teamIds }
  )

  if (membersError) {
    console.error('listMyTeams members error:', membersError)
  }

  const membersByTeam = new Map<string, typeof allMembers>()
  for (const member of allMembers ?? []) {
    const existing = membersByTeam.get(member.team_id) ?? []
    membersByTeam.set(member.team_id, [...existing, member])
  }

  return rows.map((row) => {
    const members = membersByTeam.get(row.teams.id) ?? []
    return {
      id: row.teams.id,
      name: row.teams.name,
      role: row.role,
      memberCount: members.length,
      members,
    }
  })
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

  const userTeamIds = new Set(
    (userTeams ?? []).map((t: { team_id: string }) => t.team_id)
  )

  // Return teams the user is NOT a member of
  return (allTeams ?? []).filter(
    (team: { id: string }) => !userTeamIds.has(team.id)
  )
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

  // Delete submissions if requested
  if (deleteSubmissions) {
    const { error: submissionError } = await supabase
      .from('submissions')
      .delete()
      .eq('team_id', teamId)
      .eq('submitted_by', memberId)
      .select()

    if (submissionError) {
      console.error('Error deleting submissions:', submissionError)
      return { error: 'Kunne ikke slette tidligere svar' }
    }
  }

  // Remove member from team
  const { error: deleteError } = await supabase
    .from('tt_team_memberships')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', memberId)
    .select()

  if (deleteError) {
    console.error('Error removing member:', deleteError)
    return { error: 'Kunne ikke fjerne medlem' }
  }

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

  const { data, error } = await supabase.rpc('get_users_with_submissions', {
    p_team_id: teamId,
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

  const { error: deleteError, count } = await supabase
    .from('submissions')
    .delete()
    .eq('team_id', teamId)
    .eq('submitted_by', userId)
    .select()

  if (deleteError) {
    console.error('[deleteUserSubmissions] Error:', deleteError)
    return { error: 'Kunne ikke slette besvarelser' }
  }

  return { success: true, count }
}

export async function updateMemberIncludeInStats(
  teamId: string,
  userId: string,
  includeInStats: boolean
) {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return { error: 'Ikke autentisert' }
  }

  // Verify caller is team owner or admin
  const { data: callerRole, error: roleError } = await supabase.rpc(
    'team_role',
    { p_team_id: teamId }
  )

  if (roleError || !['owner', 'admin'].includes(callerRole)) {
    console.error('[updateMemberIncludeInStats] Not authorized:', {
      roleError,
      callerRole,
    })
    return { error: 'Du har ikke tillatelse til å endre denne innstillingen' }
  }

  // Get the member's role to ensure they're external
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single()

  if (!membership) {
    return { error: 'Medlem ikke funnet' }
  }

  // Only allow changing include_in_stats for external role
  if (membership.role !== 'external') {
    return {
      error:
        'Kun eksterne brukere kan ha denne innstillingen endret. Andre roller er alltid inkludert i statistikk.',
    }
  }

  const { error: updateError } = await supabase
    .from('team_memberships')
    .update({ include_in_stats: includeInStats })
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (updateError) {
    console.error('[updateMemberIncludeInStats] Error:', updateError)
    return { error: 'Kunne ikke oppdatere innstilling' }
  }

  return { success: true }
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  newRole: string
) {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return { error: 'Ikke autentisert' }
  }

  // Verify caller is team owner (only owners can change roles)
  const { data: callerRole, error: roleError } = await supabase.rpc(
    'team_role',
    { p_team_id: teamId }
  )

  if (roleError || callerRole !== 'owner') {
    console.error('[updateMemberRole] Not owner:', {
      roleError,
      callerRole,
    })
    return { error: 'Kun team owner kan endre roller' }
  }

  // Validate role
  const validRoles = ['owner', 'admin', 'member', 'viewer', 'external']
  if (!validRoles.includes(newRole)) {
    return { error: 'Ugyldig rolle' }
  }

  // Prevent owner from changing their own role
  if (userId === u.user.id && newRole !== 'owner') {
    return { error: 'Du kan ikke endre din egen rolle som owner' }
  }

  const { error: updateError } = await supabase
    .from('team_memberships')
    .update({ role: newRole })
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (updateError) {
    console.error('[updateMemberRole] Error:', updateError)
    return { error: 'Kunne ikke oppdatere rolle' }
  }

  return { success: true }
}

export async function inviteToTeam(teamId: string, email: string) {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()
  if (authError || !u.user) return { error: 'Ikke autentisert' }

  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', u.user.id)
    .eq('status', 'active')
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Kun eier eller admin kan invitere' }
  }

  const normalizedEmail = email.trim().toLowerCase()

  // Check if already an active member via user_profiles
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existingProfile) {
    const { data: alreadyMember } = await supabase
      .from('team_memberships')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', existingProfile.user_id)
      .eq('status', 'active')
      .maybeSingle()
    if (alreadyMember) return { error: 'Denne brukeren er allerede medlem' }
  }

  // Upsert invitation (replace expired/old pending)
  const { data: existing } = await supabase
    .from('team_invitations')
    .select('id, status')
    .eq('team_id', teamId)
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existing && existing.status === 'pending') {
    return { error: 'En invitasjon til denne e-posten er allerede sendt' }
  }

  if (existing) {
    await supabase.from('team_invitations').delete().eq('id', existing.id)
  }

  const { data: invitation, error: invError } = await supabase
    .from('team_invitations')
    .insert({ team_id: teamId, email: normalizedEmail, invited_by: u.user.id })
    .select('token')
    .single()

  if (invError || !invitation) {
    console.error('[inviteToTeam] insert error:', invError)
    return { error: 'Kunne ikke opprette invitasjon' }
  }

  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

  const redirectTo = `${appUrl}/invite/accept?token=${invitation.token}`

  const { error: authInviteError } =
    await supabase.auth.admin.inviteUserByEmail(normalizedEmail, { redirectTo })

  if (authInviteError) {
    await supabase
      .from('team_invitations')
      .delete()
      .eq('token', invitation.token)
    console.error('[inviteToTeam] invite error:', authInviteError)
    return { error: authInviteError.message }
  }

  return { success: true }
}

export async function getPendingInvitations(teamId: string) {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()
  if (authError || !u.user) return { error: 'Ikke autentisert', data: [] }

  const { data, error } = await supabase
    .from('team_invitations')
    .select('id, email, created_at, expires_at, status')
    .eq('team_id', teamId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { data: data ?? [] }
}

export async function cancelInvitation(teamId: string, invitationId: string) {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()
  if (authError || !u.user) return { error: 'Ikke autentisert' }

  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', u.user.id)
    .eq('status', 'active')
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Ingen tilgang' }
  }

  const { error } = await supabase
    .from('team_invitations')
    .update({ status: 'expired' })
    .eq('id', invitationId)
    .eq('team_id', teamId)

  if (error) return { error: error.message }
  return { success: true }
}
