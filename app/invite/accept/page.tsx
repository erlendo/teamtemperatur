import { supabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    redirect('/login?error=ugyldig_invitasjon')
  }

  const supabase = supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Not authenticated yet — redirect to login, preserving the token
    redirect(`/login?redirect=/invite/accept%3Ftoken%3D${token}`)
  }

  // Look up the invitation
  const { data: invitation, error: invError } = await supabase
    .from('team_invitations')
    .select('id, team_id, email, status, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (invError || !invitation) {
    redirect('/login?error=invitasjon_ikke_funnet')
  }

  if (invitation.status !== 'pending') {
    redirect('/teams?error=invitasjon_brukt')
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('team_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)
    redirect('/teams?error=invitasjon_utgaatt')
  }

  // Check not already a member
  const { data: existing } = await supabase
    .from('team_memberships')
    .select('id')
    .eq('team_id', invitation.team_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!existing) {
    const { error: memberError } = await supabase
      .from('team_memberships')
      .insert({
        team_id: invitation.team_id,
        user_id: user.id,
        role: 'member',
        status: 'active',
      })

    if (memberError) {
      console.error('[InviteAccept] insert membership error:', memberError)
      redirect('/teams?error=kunne_ikke_legge_til')
    }
  }

  // Mark invitation as accepted
  await supabase
    .from('team_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  redirect(`/t/${invitation.team_id}`)
}
