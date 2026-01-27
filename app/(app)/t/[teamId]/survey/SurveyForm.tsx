'use client'

import { submitSurvey } from '@/server/actions/submissions'
import { saveDraft, deleteDraft } from '@/server/actions/drafts'
import { useRouter } from 'next/navigation'
import { useState, useTransition, useEffect, useCallback, useRef } from 'react'

type Question = {
  id: string
  label: string
  type: 'scale_1_5' | 'yes_no' | 'text'
  required: boolean
}

type DraftData = {
  displayName?: string
  isAnonymous: boolean
  answers: Array<{
    question_id: string
    value_num?: number | null
    value_bool?: boolean | null
    value_text?: string | null
  }>
}

export function SurveyForm({
  teamId,
  questionnaireId,
  questions,
  currentWeek,
  initialDraft,
}: {
  teamId: string
  questionnaireId: string
  questions: Question[]
  currentWeek: number
  initialDraft?: DraftData | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [clientError, setClientError] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<
    'saved' | 'saving' | 'idle' | 'error'
  >('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedSave = useCallback(
    (formData: FormData) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      setDraftStatus('saving')

      saveTimeoutRef.current = setTimeout(async () => {
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

        const result = await saveDraft({
          teamId,
          questionnaireId,
          week: weekVal,
          displayName: name || undefined,
          isAnonymous,
          answers,
        })

        if (result.success) {
          setDraftStatus('saved')
          setTimeout(() => setDraftStatus('idle'), 2000)
        } else {
          setDraftStatus('error')
        }
      }, 500)
    },
    [teamId, questionnaireId, questions]
  )

  const handleChange = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget)
    debouncedSave(formData)
  }

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
        // Delete draft on successful submission
        await deleteDraft(teamId, weekVal)
        router.push(`/t/${teamId}/survey?submitted=1&week=${result.week}`)
      } else {
        router.push(
          `/t/${teamId}/survey?error=${encodeURIComponent(result.error || 'Ukjent feil')}`
        )
      }
    })
  }

  return (
    <>
      <form
        id="survey-form"
        action={handleSubmit}
        onChange={handleChange}
        style={{ display: 'grid', gap: 14, paddingBottom: '100px' }}
      >
        {draftStatus !== 'idle' && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: '0.875rem',
              backgroundColor:
                draftStatus === 'saved'
                  ? '#ecfdf5'
                  : draftStatus === 'error'
                    ? '#fef2f2'
                    : '#f9fafb',
              color:
                draftStatus === 'saved'
                  ? '#065f46'
                  : draftStatus === 'error'
                    ? '#991b1b'
                    : '#6b7280',
            }}
          >
            {draftStatus === 'saving' && '⏱️ Lagrer utkast…'}
            {draftStatus === 'saved' && '✓ Lagret som utkast'}
            {draftStatus === 'error' && '⚠️ Kunne ikke lagre utkast'}
          </div>
        )}

        {clientError && (
          <p style={{ color: '#c33', marginBottom: 10 }}>{clientError}</p>
        )}

        <div>
          <label>Uke (1-53, standard er inneværende uke)</label>
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
        <label>
          Navn (valgfritt)
          <small style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem' }}>
            Synlig for teamadmin. Huk av «Anonym» for å skjule i statistikk.
          </small>
        </label>
        <input
          name="name"
          defaultValue={initialDraft?.displayName || ''}
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
          <input
            name="anon"
            type="checkbox"
            defaultChecked={initialDraft?.isAnonymous ?? true}
            disabled={isPending}
          />
          Anonym besvarelse
        </label>
      </div>

      <hr />

      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 12, fontSize: '1.125rem' }}>
          Spørsmål
          <small style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem', fontWeight: 'normal' }}>
            Skala: 1 = lav/dårlig, 5 = høy/god
          </small>
        </legend>

      {questions.map((q, index) => {
        const draftAnswer = initialDraft?.answers?.find(a => a.question_id === q.id)
        return (
        <div
          key={q.id}
          style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 14 }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {index + 1}. {q.label} {q.required ? <span style={{color: '#dc2626'}}>*</span> : ''}
          </div>

          {q.type === 'scale_1_5' && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <label
                  key={n}
                  style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 50 }}
                >
                  <input
                    name={`q_${q.id}`}
                    value={n}
                    type="radio"
                    required={q.required}
                    disabled={isPending}
                    defaultChecked={draftAnswer?.value_num === n}
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
                  defaultChecked={draftAnswer?.value_bool === true}
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
                  defaultChecked={draftAnswer?.value_bool === false}
                />
                Nei
              </label>
            </div>
          )}

          {q.type === 'text' && (
            <textarea
              name={`q_${q.id}`}
              defaultValue={draftAnswer?.value_text || ''}
              style={{ width: '100%', padding: 10, minHeight: 70 }}
              disabled={isPending}
            />
          )}
        </div>
        )
      })}
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: '10px 14px',
          width: 160,
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Sender inn...' : 'Send inn'}
      </button>
    </form>

    {/* Mobile sticky bar */}
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '12px 16px',
        display: 'none',
        justifyContent: 'center',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
      className="mobile-sticky-bar"
    >
      <button
        type="submit"
        form="survey-form"
        disabled={isPending}
        style={{
          padding: '12px 24px',
          width: '100%',
          maxWidth: 400,
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: '1rem',
          fontWeight: 600,
          opacity: isPending ? 0.6 : 1,
          cursor: isPending ? 'not-allowed' : 'pointer',
        }}
      >
        {isPending ? 'Sender inn...' : 'Send inn'}
      </button>
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-sticky-bar {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  </>
  )
}
