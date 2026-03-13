'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { revalidatePath } from 'next/cache'

export interface WeeklySummaryData {
  overallAvg: number
  bayesianAdjusted: number
  responseRate: number
  responseCount: number
  memberCount: number
  topQuestionLabel?: string
  topQuestionScore?: number
  bottomQuestionLabel?: string
  bottomQuestionScore?: number
}

export async function getWeeklySummary(
  teamId: string,
  year: number,
  weekNumber: number
): Promise<string> {
  const supabase = supabaseServer()
  const { data: existingSummary, error: selectError } = await supabase
    .from('ai_weekly_summaries')
    .select('summary')
    .eq('team_id', teamId)
    .eq('year', year)
    .eq('week_number', weekNumber)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error fetching summary:', selectError)
    return ''
  }

  return existingSummary?.summary?.trim() || ''
}

/**
 * Intern funksjon for å kalle LLM og generere tekst.
 */
async function generateSummary(
  data: WeeklySummaryData,
  model: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('[AI Summary] OPENAI_API_KEY is not configured')
    return 'OpenAI API-nøkkel er ikke konfigurert.'
  }

  console.log('[AI Summary] Calling OpenAI with model:', model)

  const allResponded = data.responseCount === data.memberCount
  const nonRespondentCount = data.memberCount - data.responseCount

  const participationInstruction = allResponded
    ? `🎉 **Alle teammedlemmer har svart!** Gi gjerne formiddabel skryt for høy deltakelse og engasjement rundt temperaturmålingen.`
    : `📊 **${nonRespondentCount} teammedlem${nonRespondentCount === 1 ? '' : 'er'} har ikke svart.**
Vurder å kommentere på dette med litt syrlig humor - f.eks. frykter de sannheten, eller er de bare opptatt med viktigere ting? Hold det lett og morsomt!`

  const prompt = `Du er en hjelpsom og litt humoristisk assistent som oppsummerer teamdata.
Her er ukens 'Team Temperature'-resultater for et team.
Tallene går fra 1 (veldig lavt) til 5 (veldig høyt).

- Teamhelse (hovedtall, bayesiansk justert): ${data.bayesianAdjusted.toFixed(2)}
- Råscore (sekundært tall): ${data.overallAvg.toFixed(2)}
- Svarprosent: ${data.responseRate.toFixed(0)}% (${data.responseCount} av ${data.memberCount})
- Toppområde: ${data.topQuestionLabel ?? 'Ukjent'} (${data.topQuestionScore?.toFixed(2) ?? '–'})
- Forbedringsområde: ${data.bottomQuestionLabel ?? 'Ukjent'} (${data.bottomQuestionScore?.toFixed(2) ?? '–'})

Skriv en kort, innsiktsfull og litt morsom oppsummering på norsk (maks 3 setninger).
Bruk teamhelse (bayesiansk justert) som primært tall når du omtaler generell helse.
Nevn råscore kun hvis det gir nyttig kontekst.
Bruk gjerne norske uttrykk, metaforer eller lett humor, men hold det profesjonelt.
Fokuser på de mest interessante punktene eller trendene i dataene.

${participationInstruction}`

  try {
    const { text } = await generateText({
      model: openai(model),
      prompt,
      temperature: 0.7,
    })

    console.log(
      '[AI Summary] OpenAI response received, length:',
      text?.length || 0
    )

    if (!text) throw new Error('Fikk ikke generert en oppsummering.')

    return text.trim()
  } catch (error) {
    console.error('[AI Summary] Error calling OpenAI API:', error)
    return 'Det skjedde en feil under generering av oppsummering.'
  }
}

/**
 * Lar owner generere eller regenerere et ukentlig sammendrag manuelt.
 *
 * @param teamId Teamets ID
 * @param year År for sammendraget
 * @param weekNumber Ukenummer for sammendraget
 * @param data Datagrunnlaget for generering
 * @returns Resultat med success/error
 */
export async function regenerateWeeklySummary(
  teamId: string,
  year: number,
  weekNumber: number,
  data: WeeklySummaryData
): Promise<{ success: boolean; error?: string; summary?: string }> {
  const supabase = supabaseServer()
  const model = 'gpt-4o-mini'
  const promptVersion = 'bayesian-primary-v1'
  const modelUsed = `${model}:${promptVersion}`

  // 1. Verifiser at brukeren er authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Ikke autentisert' }
  }

  // 2. Verifiser at brukeren er owner av teamet
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership || membership.role !== 'owner') {
    return {
      success: false,
      error: 'Kun eier kan generere AI-sammendrag',
    }
  }

  if (data.responseCount === 0 || data.memberCount === 0) {
    return {
      success: false,
      error: 'Det finnes ikke nok svargrunnlag for å generere sammendrag',
    }
  }

  const { data: existingSummary, error: existingSummaryError } = await supabase
    .from('ai_weekly_summaries')
    .select('id')
    .eq('team_id', teamId)
    .eq('year', year)
    .eq('week_number', weekNumber)
    .maybeSingle()

  if (existingSummaryError) {
    console.error(
      '[AI Summary] Error checking existing summary before regeneration:',
      existingSummaryError
    )
    return {
      success: false,
      error: 'Kunne ikke kontrollere eksisterende sammendrag',
    }
  }

  if (data.responseCount !== data.memberCount && !existingSummary) {
    return {
      success: false,
      error: 'AI-sammendrag kan først genereres når alle har svart',
    }
  }

  // 3. Generer nytt sammendrag
  console.log(
    '[AI Summary] Generating summary on owner request for team:',
    teamId,
    'year:',
    year,
    'week:',
    weekNumber
  )
  const newSummary = await generateSummary(data, model)

  if (!newSummary || newSummary.includes('feil')) {
    return { success: false, error: 'Kunne ikke generere nytt sammendrag' }
  }

  // 4. Lagre eller erstatt sammendraget
  const { error: insertError } = await supabase
    .from('ai_weekly_summaries')
    .upsert(
      {
        team_id: teamId,
        year,
        week_number: weekNumber,
        summary: newSummary,
        model_used: modelUsed,
      },
      {
        onConflict: 'team_id,year,week_number',
      }
    )

  if (insertError) {
    console.error('[AI Summary] Error saving summary:', insertError)
    return {
      success: false,
      error: `Kunne ikke lagre nytt sammendrag: ${insertError.message}`,
    }
  }

  revalidatePath(`/t/${teamId}/stats`)
  revalidatePath(`/t/${teamId}/stats?week=${weekNumber}`)

  console.log('[AI Summary] Successfully generated and saved summary')
  return { success: true, summary: newSummary }
}
