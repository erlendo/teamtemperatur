'use server'

import { supabaseServer } from '@/lib/supabase/server'

type AnswerPayload = {
  question_id: string
  value_num?: number | null
  value_bool?: boolean | null
  value_text?: string | null
}

export async function submitSurvey(input: {
  teamId: string
  questionnaireId: string
  week: number
  displayName?: string
  isAnonymous: boolean
  answers: AnswerPayload[]
}): Promise<{ success: boolean; error?: string; week?: number }> {
  const supabase = supabaseServer()
  const { data: u, error: authError } = await supabase.auth.getUser()

  if (authError || !u.user) {
    return { success: false, error: 'Du må være logget inn' }
  }

  // Verify membership BEFORE attempting insert
  console.log(
    '[submitSurvey] Checking membership for user:',
    u.user.id,
    'team:',
    input.teamId
  )

  const { data: membership, error: memCheckErr } = await supabase
    .from('tt_team_memberships')
    .select('team_id')
    .eq('team_id', input.teamId)
    .eq('user_id', u.user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (memCheckErr) {
    console.error('[submitSurvey] Membership check error:', memCheckErr)
    return {
      success: false,
      error: 'Kunne ikke verifisere medlemskap',
    }
  }

  if (!membership) {
    console.log('[submitSurvey] User not a member of team')
    return {
      success: false,
      error: 'Du er ikke medlem av dette teamet',
    }
  }

  try {
    console.log(
      '[submitSurvey] Starting submission for team:',
      input.teamId,
      'week:',
      input.week
    )

    const { data: submission, error: sErr } = await supabase
      .from('tt_submissions')
      .insert({
        team_id: input.teamId,
        questionnaire_id: input.questionnaireId,
        week: input.week,
        submitted_by: u.user.id,
        display_name: input.displayName ?? null,
        is_anonymous: input.isAnonymous,
      })
      .select()
      .single()

    console.log('[submitSurvey] Submission result:', {
      sErr: sErr?.message,
      submissionId: submission?.id,
    })

    if (sErr) throw sErr

    const rows = input.answers.map((a) => ({
      submission_id: submission.id,
      question_id: a.question_id,
      value_num: a.value_num ?? null,
      value_bool: a.value_bool ?? null,
      value_text: a.value_text ?? null,
    }))

    console.log('[submitSurvey] Inserting', rows.length, 'answers')

    const { error: aErr } = await supabase.from('tt_answers').insert(rows)

    console.log('[submitSurvey] Answers result:', { aErr: aErr?.message })

    if (aErr) throw aErr

    console.log('[submitSurvey] SUCCESS')
    return { success: true, week: input.week }
  } catch (err) {
    console.error('[submitSurvey] CAUGHT ERROR:', err)
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Ukjent feil'
    console.log('[submitSurvey] Error message:', msg)
    const friendly = msg.includes('unique')
      ? 'Du har allerede svart for denne uken'
      : msg
    console.log('[submitSurvey] Friendly error:', friendly)
    return { success: false, error: friendly }
  }
}
