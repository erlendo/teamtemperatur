import { loadActiveQuestionnaire } from '@/server/queries/questionnaires'
import { SurveyForm } from './SurveyForm'

function currentWeekNumberSimple() {
  const d = new Date()
  const start = new Date(d.getFullYear(), 0, 1)
  const days = Math.floor((d.getTime() - start.getTime()) / 86400000)
  return Math.ceil((days + start.getDay() + 1) / 7)
}

export default async function SurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>
  searchParams: Promise<{ error?: string; submitted?: string; week?: string }>
}) {
  const { teamId } = await params
  const { questionnaire, questions, error } =
    await loadActiveQuestionnaire(teamId)
  const week = currentWeekNumberSimple()

  const sp = await searchParams
  const errorMsg = sp?.error
  const submittedWeek = sp?.submitted ? sp.week : undefined

  if (!questionnaire) {
    return (
      <div style={{ maxWidth: 780 }}>
        <h1>Ny måling</h1>
        <p style={{ color: '#d00', marginBottom: 10 }}>
          Fant ingen aktiv spørreundersøkelse for dette teamet.
        </p>
        {error ? (
          <p style={{ color: '#c33' }}>{error}</p>
        ) : (
          <p style={{ color: '#666' }}>
            Vi prøvde å opprette standard skjema. Prøv igjen om et øyeblikk.
          </p>
        )}
        <p style={{ marginTop: 14 }}>
          <a href={`/t/${teamId}`}>← Til team</a>
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 780 }}>
      <h1>Ny måling</h1>

      {errorMsg ? (
        <p style={{ color: '#c33', marginBottom: 10 }}>{errorMsg}</p>
      ) : null}
      {submittedWeek ? (
        <p style={{ color: '#0a0', marginBottom: 10 }}>
          Lagret for uke {submittedWeek}. Se statistikk under «Statistikk».
        </p>
      ) : null}
      <p style={{ color: '#666' }}>
        {questionnaire.name} (v{questionnaire.version})
      </p>

      <SurveyForm
        teamId={teamId}
        questionnaireId={questionnaire.id}
        questions={questions}
        currentWeek={week}
      />

      <p style={{ marginTop: 14 }}>
        <a href={`/t/${teamId}`}>← Til team</a>
      </p>
    </div>
  )
}
