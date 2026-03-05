'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

interface WeeklySummaryData {
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

/**
 * Henter eller genererer og lagrer en ukentlig AI-oppsummering for et team.
 * Sjekker først databasen om en oppsummering allerede finnes for den gitte uken.
 * Hvis ikke, genereres en ny, lagres, og returneres.
 *
 * @param teamId Teamets ID.
 * @param year Året for oppsummeringen.
 * @param weekNumber Ukenummeret for oppsummeringen.
 * @param data Datagrunnlaget for å generere en ny oppsummering.
 * @returns En streng med den genererte oppsummeringen.
 */
export async function getOrGenerateWeeklySummary(
  teamId: string,
  year: number,
  weekNumber: number,
  data: WeeklySummaryData
): Promise<string> {
  const supabase = supabaseServer()
  const model = 'gpt-4o-mini'
  const promptVersion = 'bayesian-primary-v1'
  const modelUsed = `${model}:${promptVersion}`

  // 1. Sjekk for eksisterende sammendrag
  const { data: existingSummary, error: selectError } = await supabase
    .from('ai_weekly_summaries')
    .select('summary, model_used')
    .eq('team_id', teamId)
    .eq('year', year)
    .eq('week_number', weekNumber)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    // Ignore 'no rows' error
    console.error('Error fetching summary:', selectError)
    return '' // Returnerer tomt hvis det er en feil
  }

  if (
    existingSummary?.summary?.trim() &&
    existingSummary.model_used === modelUsed
  ) {
    return existingSummary.summary
  }

  if (
    existingSummary?.summary?.trim() &&
    existingSummary.model_used !== modelUsed
  ) {
    console.log(
      '[AI Summary] Regenerating summary due to model/prompt version change:',
      existingSummary.model_used,
      '->',
      modelUsed
    )
  }

  // 2. Hvis ingen oppsummering finnes, generer en ny
  // Sjekk at vi har data å analysere for å unngå unødvendige API-kall
  if (data.responseCount === 0 || data.memberCount === 0) {
    console.log(
      '[AI Summary] Skipping generation - no data (responseCount:',
      data.responseCount,
      'memberCount:',
      data.memberCount,
      ')'
    )
    return '' // Ikke generer sammendrag for tomme data
  }

  console.log(
    '[AI Summary] Generating new summary for team:',
    teamId,
    'year:',
    year,
    'week:',
    weekNumber
  )
  const newSummary = await generateSummary(data, model)
  console.log('[AI Summary] Generated summary length:', newSummary?.length || 0)

  if (!newSummary || newSummary.includes('feil')) {
    return newSummary // Returner feilmeldingen fra genereringsfunksjonen
  }

  // 3. Lagre det nye sammendraget i databasen
  console.log('[AI Summary] Attempting to save summary to database...')
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
    console.error('[AI Summary] Error saving new summary:', insertError)
    // Returnerer det nylig genererte sammendraget uansett,
    // slik at brukeren ser det selv om lagring feiler.
  } else {
    console.log('[AI Summary] Successfully saved summary to database')
  }

  return newSummary
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
 * Lar admin/owner tvinge regenerering av et ukentlig sammendrag ved å slette det cachede
 * og generere nytt.
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
): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseServer()

  // 1. Verifiser at brukeren er authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Ikke autentisert' }
  }

  // 2. Verifiser at brukeren er admin/owner av teamet
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
    return { success: false, error: 'Kun admin/owner kan regenerere sammendrag' }
  }

  // 3. Slett det old sammendraget
  const { error: deleteError } = await supabase
    .from('ai_weekly_summaries')
    .delete()
    .eq('team_id', teamId)
    .eq('year', year)
    .eq('week_number', weekNumber)

  if (deleteError) {
    console.error('[AI Summary] Error deleting old summary:', deleteError)
    return { success: false, error: 'Kunne ikke slette gammelt sammendrag' }
  }

  // 4. Generer nytt sammendrag
  console.log(
    '[AI Summary] Regenerating summary for team:',
    teamId,
    'year:',
    year,
    'week:',
    weekNumber
  )
  const newSummary = await generateSummary(data, 'gpt-4o-mini')

  if (!newSummary || newSummary.includes('feil')) {
    return { success: false, error: 'Kunne ikke generere nytt sammendrag' }
  }

  // 5. Lagre det nye sammendraget
  const promptVersion = 'bayesian-primary-v1'
  const modelUsed = `gpt-4o-mini:${promptVersion}`

  const { error: insertError } = await supabase
    .from('ai_weekly_summaries')
    .insert({
      team_id: teamId,
      year,
      week_number: weekNumber,
      summary: newSummary,
      model_used: modelUsed,
    })

  if (insertError) {
    console.error('[AI Summary] Error saving regenerated summary:', insertError)
    return { success: false, error: 'Kunne ikke lagre nytt sammendrag' }
  }

  console.log('[AI Summary] Successfully regenerated and saved summary')
  return { success: true }
}
