'use server'

import { supabaseServer } from '@/lib/supabase/server'

type AnswerPayload = {
  question_id: string
  value_num?: number | null
  value_bool?: boolean | null
  value_text?: string | null
}

type DraftPayload = {
  teamId: string
  questionnaireId: string
  week: number
  displayName?: string
  isAnonymous: boolean
  answers: AnswerPayload[]
}

export async function saveDraft(
  input: DraftPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return { success: false, error: 'Du må være logget inn' }
  }

  try {
    const { error } = await supabase.from('tt_drafts').upsert(
      {
        team_id: input.teamId,
        questionnaire_id: input.questionnaireId,
        week: input.week,
        user_id: u.user.id,
        display_name: input.displayName ?? null,
        is_anonymous: input.isAnonymous,
        answers: input.answers,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'team_id,week,user_id',
      }
    )

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('[saveDraft] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Kunne ikke lagre utkast',
    }
  }
}

export async function loadDraft(
  teamId: string,
  week: number
): Promise<{
  draft: DraftPayload | null
  error?: string
}> {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return { draft: null, error: 'Du må være logget inn' }
  }

  try {
    const { data, error } = await supabase
      .from('tt_drafts')
      .select('*')
      .eq('team_id', teamId)
      .eq('week', week)
      .eq('user_id', u.user.id)
      .maybeSingle()

    if (error) throw error
    if (!data) return { draft: null }

    return {
      draft: {
        teamId: data.team_id,
        questionnaireId: data.questionnaire_id,
        week: data.week,
        displayName: data.display_name ?? undefined,
        isAnonymous: data.is_anonymous,
        answers: data.answers as AnswerPayload[],
      },
    }
  } catch (err) {
    console.error('[loadDraft] Error:', err)
    return {
      draft: null,
      error: err instanceof Error ? err.message : 'Kunne ikke laste utkast',
    }
  }
}

export async function deleteDraft(
  teamId: string,
  week: number
): Promise<{ success: boolean }> {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) return { success: false }

  await supabase
    .from('tt_drafts')
    .delete()
    .eq('team_id', teamId)
    .eq('week', week)
    .eq('user_id', u.user.id)

  return { success: true }
}
