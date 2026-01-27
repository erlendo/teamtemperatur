'use client'

import { submitSurvey } from '@/server/actions/submissions'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type Question = {
  id: string
  label: string
  type: 'scale_1_5' | 'yes_no' | 'text'
  required: boolean
}

export function SurveyForm({
  teamId,
  questionnaireId,
  questions,
  currentWeek,
}: {
  teamId: string
  questionnaireId: string
  questions: Question[]
  currentWeek: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [clientError, setClientError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setClientError(null)

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

    startTransition(async () => {
      const result = await submitSurvey({
        teamId,
        questionnaireId,
        week: weekVal,
        displayName: name || undefined,
        isAnonymous,
        answers,
      })

      if (result.success) {
        router.push(`/t/${teamId}/survey?submitted=1&week=${result.week}`)
      } else {
        router.push(
          `/t/${teamId}/survey?error=${encodeURIComponent(result.error || 'Ukjent feil')}`
        )
      }
    })
  }

  return (
    <form action={handleSubmit} style={{ display: 'grid', gap: 14 }}>
      {clientError && (
        <p style={{ color: '#c33', marginBottom: 10 }}>{clientError}</p>
      )}

      <div>
        <label>Uke</label>
        <input
          name="week"
          defaultValue={currentWeek}
          type="number"
          min={1}
          max={53}
          style={{ width: 120, padding: 10, display: 'block' }}
          disabled={isPending}
        />
      </div>

      <div>
        <label>Navn (valgfritt)</label>
        <input
          name="name"
          placeholder="Tomt = anonym"
          style={{ width: '100%', padding: 10 }}
          disabled={isPending}
        />
        <label
          style={{
            display: 'inline-flex',
            gap: 8,
            marginTop: 8,
            alignItems: 'center',
          }}
        >
          <input name="anon" type="checkbox" defaultChecked disabled={isPending} />
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
                    disabled={isPending}
                  />
                  {n}
                </label>
              ))}
            </div>
          )}

          {q.type === 'yes_no' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  name={`q_${q.id}`}
                  value="ja"
                  type="radio"
                  required={q.required}
                  disabled={isPending}
                />
                Ja
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  name={`q_${q.id}`}
                  value="nei"
                  type="radio"
                  required={q.required}
                  disabled={isPending}
                />
                Nei
              </label>
            </div>
          )}

          {q.type === 'text' && (
            <textarea
              name={`q_${q.id}`}
              style={{ width: '100%', padding: 10, minHeight: 70 }}
              disabled={isPending}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: '10px 14px',
          width: 160,
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Lagrer...' : 'Lagre'}
      </button>
    </form>
  )
}
