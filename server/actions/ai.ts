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

  // 1. Sjekk for eksisterende sammendrag
  const { data: existingSummary, error: selectError } = await supabase
    .from('ai_weekly_summaries')
    .select('summary')
    .eq('team_id', teamId)
    .eq('year', year)
    .eq('week_number', weekNumber)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    // Ignore 'no rows' error
    console.error('Error fetching summary:', selectError)
    return '' // Returnerer tomt hvis det er en feil
  }

  if (existingSummary?.summary?.trim()) {
    return existingSummary.summary
  }

  // 2. Hvis ingen oppsummering finnes, generer en ny
  // Sjekk at vi har data å analysere for å unngå unødvendige API-kall
  if (data.responseCount === 0 || data.memberCount === 0) {
    console.log('[AI Summary] Skipping generation - no data (responseCount:', data.responseCount, 'memberCount:', data.memberCount, ')')
    return '' // Ikke generer sammendrag for tomme data
  }

  console.log('[AI Summary] Generating new summary for team:', teamId, 'year:', year, 'week:', weekNumber)
  const model = 'gpt-4o-mini'
  const newSummary = await generateSummary(data, model)
  console.log('[AI Summary] Generated summary length:', newSummary?.length || 0)

  if (!newSummary || newSummary.includes('feil')) {
    return newSummary // Returner feilmeldingen fra genereringsfunksjonen
  }

  // 3. Lagre det nye sammendraget i databasen
  console.log('[AI Summary] Attempting to save summary to database...')
  const { error: insertError } = await supabase
    .from('ai_weekly_summaries')
    .insert({
      team_id: teamId,
      year,
      week_number: weekNumber,
      summary: newSummary,
      model_used: model,
    })

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

  const prompt = `Du er en hjelpsom og litt humoristisk assistent for teamledere.
Her er ukens 'Team Temperature'-resultater for et team.
Tallene går fra 1 (veldig lavt) til 5 (veldig høyt).

- Total helse (råscore): ${data.overallAvg.toFixed(2)}
- Bayesiansk justert: ${data.bayesianAdjusted.toFixed(2)}
- Svarprosent: ${data.responseRate.toFixed(0)}% (${data.responseCount} av ${data.memberCount})
- Toppområde: ${data.topQuestionLabel ?? 'Ukjent'} (${data.topQuestionScore?.toFixed(2) ?? '–'})
- Forbedringsområde: ${data.bottomQuestionLabel ?? 'Ukjent'} (${data.bottomQuestionScore?.toFixed(2) ?? '–'})

Skriv en kort, innsiktsfull og litt morsom oppsummering på norsk (maks 3 setninger) for en teamleder.
Bruk gjerne norske uttrykk, metaforer eller lett humor, men hold det profesjonelt.
Fokuser på de mest interessante punktene eller trendene i dataene.`

  try {
    const { text } = await generateText({
      model: openai(model),
      prompt,
      temperature: 0.7,
    })

    console.log('[AI Summary] OpenAI response received, length:', text?.length || 0)

    if (!text) throw new Error('Fikk ikke generert en oppsummering.')

    return text.trim()
  } catch (error) {
    console.error('[AI Summary] Error calling OpenAI API:', error)
    return 'Det skjedde en feil under generering av oppsummering.'
  }
}
