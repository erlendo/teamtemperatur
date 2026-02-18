import { AppHeader } from '@/components/AppHeader'
import { supabaseServer } from '@/lib/supabase/server'
import { loadDraft } from '@/server/actions/drafts'
import { loadActiveQuestionnaire } from '@/server/queries/questionnaires'
import { redirect } from 'next/navigation'
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

  const supabase = supabaseServer()
  const { data: authUser, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser.user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role, include_in_stats')
    .eq('team_id', teamId)
    .eq('user_id', authUser.user.id)
    .eq('status', 'active')
    .maybeSingle()

  const isTeamAdmin =
    membership?.role === 'owner' || membership?.role === 'admin'

  const { data: team } = await supabase
    .from('teams')
    .select('name')
    .eq('id', teamId)
    .maybeSingle()

  const teamName = team?.name ?? undefined

  // Check if user is allowed to participate in health surveys
  const canParticipateInSurvey = membership?.include_in_stats === true

  if (!canParticipateInSurvey) {
    return (
      <>
        <AppHeader
          teamId={teamId}
          teamName={teamName}
          isTeamAdmin={isTeamAdmin}
        />
        <main style={{ flex: 1 }}>
          <div
            style={{
              maxWidth: '800px',
              margin: '0 auto',
              padding: 'var(--space-xl) var(--space-md)',
            }}
          >
            <h1 style={{ color: 'var(--color-neutral-700)' }}>
              📋 Helse-undersøkelse
            </h1>
            <div
              style={{
                backgroundColor: 'var(--color-neutral-100)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                marginTop: 'var(--space-xl)',
              }}
            >
              <p style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>
                Du er registrert som ekstern samarbeidspartner i dette teamet.
                Eksterne brukere deltar ikke i helse-undersøkelsene med mindre
                dette er aktivert av en team administrator.
              </p>
              <p
                style={{
                  margin: 'var(--space-md) 0 0 0',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-neutral-600)',
                }}
              >
                Ta kontakt med team owner eller admin hvis du skal delta i
                helse-målingene.
              </p>
            </div>
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
        <AppHeader
          teamId={teamId}
          teamName={teamName}
          isTeamAdmin={isTeamAdmin}
        />
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
      <AppHeader
        teamId={teamId}
        teamName={teamName}
        isTeamAdmin={isTeamAdmin}
      />
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
