import { supabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loadActiveQuestionnaire(teamId: string) {
  const supabase = supabaseServer()

  const { data: authUser, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser.user) {
    redirect('/login')
  }

  const { data: membership, error: membershipError } = await supabase
    .from('team_memberships')
    .select('team_id')
    .eq('team_id', teamId)
    .eq('user_id', authUser.user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError) throw membershipError
  if (!membership) redirect('/teams')

  const fetchActiveQuestionnaire = async () =>
    supabase
      .from('questionnaires')
      .select('id, name, version')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

  let { data: questionnaire, error: qErr } = await fetchActiveQuestionnaire()
  if (qErr) throw qErr

  if (!questionnaire) {
    const { error: createErr } = await supabase.rpc(
      'create_default_questionnaire',
      {
        p_team_id: teamId,
        p_created_by: authUser.user.id,
      }
    )

    if (createErr) {
      return { questionnaire: null, questions: [], error: createErr.message }
    }

    const retry = await fetchActiveQuestionnaire()
    questionnaire = retry.data
    qErr = retry.error
  }

  if (qErr) throw qErr
  if (!questionnaire) {
    return { questionnaire: null, questions: [] }
  }

  const { data: questions, error: quErr } = await supabase
    .from('questions')
    .select('id, key, label, type, required, sort_order')
    .eq('questionnaire_id', questionnaire.id)
    .order('sort_order', { ascending: true })

  if (quErr) throw quErr

  return { questionnaire, questions: questions ?? [] }
}
