'use server'

import { supabaseServer } from '@/lib/supabase/server'

export async function sendMagicLink(email: string) {
  const supabase = supabaseServer()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/teams`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function saveUserProfile(
  firstName: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = supabaseServer()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Bruker ikke innlogget' }
    }

    const { error: insertError } = await supabase.from('user_profiles').insert({
      user_id: user.id,
      first_name: firstName,
    })

    if (insertError) {
      return { error: insertError.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ukjent feil'
    return { error: message }
  }
}

export async function adminUpdateUserFirstName(
  userId: string,
  firstName: string,
  teamId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = supabaseServer()

  try {
    // Get current user
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !currentUser) {
      return { error: 'Ikke autentisert' }
    }

    // Check if current user is team owner
    const { data: membership, error: memberError } = await supabase
      .from('team_memberships')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', currentUser.id)
      .single()

    if (memberError || !membership || membership.role !== 'owner') {
      return { error: 'Bare team-eiere kan oppdatere bruker-profiler' }
    }

    // Validate first_name
    if (!firstName || firstName.trim().length === 0) {
      return { error: 'Fornavn kan ikke være tomt' }
    }

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return { error: 'Feil ved sjekking av profil' }
    }

    let result
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('user_profiles')
        .update({ first_name: firstName.trim() })
        .eq('user_id', userId)
    } else {
      // Insert new profile
      result = await supabase
        .from('user_profiles')
        .insert({ user_id: userId, first_name: firstName.trim() })
    }

    if (result.error) {
      return { error: result.error.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ukjent feil'
    return { error: message }
  }
}
