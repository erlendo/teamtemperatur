import { submitSurvey } from '@/server/actions/submissions'
import { loadActiveQuestionnaire } from '@/server/queries/questionnaires'

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

      <form
        action={async (formData) => {
          'use server'

          const weekVal = Number(formData.get('week'))
          const name = String(formData.get('name') || '').trim()
          const isAnonymous = formData.get('anon') === 'on'

          const answers = questions.map((q) => {
            const raw = formData.get(`q_${q.id}`)
            if (q.type === 'scale_1_5')
              return { question_id: q.id, value_num: raw ? Number(raw) : null }
            if (q.type === 'yes_no')
              return { question_id: q.id, value_bool: raw === 'ja' }
            return { question_id: q.id, value_text: raw ? String(raw) : '' }
          })

          await submitSurvey({
            teamId,
            questionnaireId: questionnaire.id,
            week: weekVal,
            displayName: name || undefined,
            isAnonymous,
            answers,
          })
        }}
        style={{ display: 'grid', gap: 14 }}
      >
        <div>
          <label>Uke</label>
          <input
            name="week"
            defaultValue={week}
            type="number"
            min={1}
            max={53}
            style={{ width: 120, padding: 10, display: 'block' }}
          />
        </div>

        <div>
          <label>Navn (valgfritt)</label>
          <input
            name="name"
            placeholder="Tomt = anonym"
            style={{ width: '100%', padding: 10 }}
          />
          <label
            style={{
              display: 'inline-flex',
              gap: 8,
              marginTop: 8,
              alignItems: 'center',
            }}
          >
            <input name="anon" type="checkbox" defaultChecked />
            Anonym besvarelse
          </label>
        </div>

        <hr />

        {questions.map((q) => (
          <div
            key={q.id}
            style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {q.label} {q.required ? ' *' : ''}
            </div>

            {q.type === 'scale_1_5' && (
              <div style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label
                    key={n}
                    style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                  >
                    <input
                      name={`q_${q.id}`}
                      value={n}
                      type="radio"
                      required={q.required}
                    />
                    {n}
                  </label>
                ))}
              </div>
            )}

            {q.type === 'yes_no' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <label
                  style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                >
                  <input
                    name={`q_${q.id}`}
                    value="ja"
                    type="radio"
                    required={q.required}
                  />
                  Ja
                </label>
                <label
                  style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                >
                  <input
                    name={`q_${q.id}`}
                    value="nei"
                    type="radio"
                    required={q.required}
                  />
                  Nei
                </label>
              </div>
            )}

            {q.type === 'text' && (
              <textarea
                name={`q_${q.id}`}
                style={{ width: '100%', padding: 10, minHeight: 70 }}
              />
            )}
          </div>
        ))}

        <button style={{ padding: '10px 14px', width: 160 }}>Lagre</button>
      </form>

      <p style={{ marginTop: 14 }}>
        <a href={`/t/${teamId}`}>← Til team</a>
      </p>
    </div>
  )
}
