'use server'

import { supabaseServer } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI()

interface WeeklySummaryData {
  motivation: number
  workload: number
  wellbeing: number
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

  if (existingSummary) {
    return existingSummary.summary
  }

  // 2. Hvis ingen oppsummering finnes, generer en ny
  // Sjekk at vi har data å analysere for å unngå unødvendige API-kall
  if (Object.values(data).every((val) => val === 0)) {
    return '' // Ikke generer sammendrag for tomme data
  }

  const model = 'gpt-4o-mini'
  const newSummary = await generateSummary(data, model)

  if (!newSummary || newSummary.includes('feil')) {
    return newSummary // Returner feilmeldingen fra genereringsfunksjonen
  }

  // 3. Lagre det nye sammendraget i databasen
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
    console.error('Error saving new summary:', insertError)
    // Returnerer det nylig genererte sammendraget uansett,
    // slik at brukeren ser det selv om lagring feiler.
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
    return 'OpenAI API-nøkkel er ikke konfigurert.'
  }

  const prompt = `
    Du er en hjelpsom assistent for teamledere.
    Her er ukens 'Team Temperature'-resultater for et team.
    Tallene går fra 1 (veldig lavt) til 5 (veldig høyt).

    - Motivasjon: ${data.motivation.toFixed(1)}
    - Arbeidsmengde: ${data.workload.toFixed(1)}
    - Trivsel: ${data.wellbeing.toFixed(1)}

    Skriv en kort, nøytral og innsiktsfull oppsummering på norsk (maks 3 setninger) for en teamleder.
    Fokuser på de mest interessante punktene eller trendene i dataene.
  `

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 150,
    })

    const summary = response.choices[0]?.message?.content
    if (!summary) throw new Error('Fikk ikke generert en oppsummering.')

    return summary.trim()
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    return 'Det skjedde en feil under generering av oppsummering.'
  }
}
