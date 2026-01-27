import { AppHeader } from '@/components/AppHeader'
import { loadDraft } from '@/server/actions/drafts'
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

  // Load existing draft for this week
  const { draft } = await loadDraft(teamId, week)

  if (!questionnaire) {
    return (
      <>
        <AppHeader teamId={teamId} />
        <main style={{ flex: 1 }}>
          <div
            style={{
              maxWidth: '800px',
              margin: '0 auto',
              padding: 'var(--space-xl) var(--space-md)',
            }}
          >
            <h1 style={{ color: 'var(--color-error)' }}>❌ Feil</h1>
            <p>Fant ingen aktiv spørreundersøkelse for dette teamet.</p>
            {error ? (
              <p
                style={{ color: 'var(--color-error-dark)', fontWeight: '500' }}
              >
                {error}
              </p>
            ) : (
              <p style={{ color: 'var(--color-neutral-600)' }}>
                Vi prøvde å opprette standard skjema. Prøv igjen om et øyeblikk.
              </p>
            )}
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <a
                href={`/t/${teamId}`}
                style={{ color: 'var(--color-primary)', fontWeight: '500' }}
              >
                ← Tilbake til team
              </a>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AppHeader teamId={teamId} teamName={questionnaire.name} />
      <main style={{ flex: 1 }}>
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: 'var(--space-xl) var(--space-md)',
          }}
        >
          <div style={{ marginBottom: 'var(--space-2xl)' }}>
            <h1 style={{ marginBottom: 'var(--space-md)' }}>📝 Ny måling</h1>
            <p style={{ color: 'var(--color-neutral-600)', marginBottom: 0 }}>
              Versjon {questionnaire.version} av {questionnaire.name}
            </p>
          </div>

          {errorMsg ? (
            <div className="alert alert-error">{errorMsg}</div>
          ) : null}
          {submittedWeek ? (
            <div className="alert alert-success">
              ✅ Lagret for uke {submittedWeek}. Takk for tilbakemeldingen!
            </div>
          ) : null}

          <SurveyForm
            teamId={teamId}
            questionnaireId={questionnaire.id}
            questions={questions}
            currentWeek={week}
            initialDraft={draft}
          />
        </div>
      </main>
    </>
  )
}
