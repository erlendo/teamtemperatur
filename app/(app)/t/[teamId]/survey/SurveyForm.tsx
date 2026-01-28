'use client'

import { deleteDraft, saveDraft } from '@/server/actions/drafts'
import { submitSurvey } from '@/server/actions/submissions'
import {
  AlertCircle,
  Check,
  CheckCircle,
  Loader,
  Send,
  Target,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState, useTransition } from 'react'

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

  // Track selected answers locally for UI updates
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number | boolean | string | null>
  >(() => {
    const initial: Record<string, number | boolean | string | null> = {}
    initialDraft?.answers.forEach((a) => {
      if (a.value_num !== undefined) initial[a.question_id] = a.value_num
      else if (a.value_bool !== undefined) initial[a.question_id] = a.value_bool
      else if (a.value_text !== undefined) initial[a.question_id] = a.value_text
    })
    return initial
  })
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 'var(--space-md)',
    border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'white',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-neutral-900)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: 'var(--shadow-sm)',
  }
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
          console.error('[SurveyForm] Draft save failed:', result.error)
          setDraftStatus('error')
          setClientError(result.error || 'Kunne ikke lagre utkast')
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
      if (q.type === 'text')
        return { question_id: q.id, value_text: String(raw || '') }
      return { question_id: q.id }
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

      if ('error' in result) {
        setClientError(result.error || 'En ukjent feil oppstod')
      } else {
        await deleteDraft(teamId, weekVal)
        router.push(`/t/${teamId}/survey?submitted=true&week=${weekVal}`)
      }
    })
  }

  return (
    <>
      <form
        id="survey-form"
        action={handleSubmit}
        onChange={handleChange}
        style={{
          display: 'grid',
          gap: 'var(--space-3xl)',
          paddingBottom: '120px',
        }}
      >
        {/* Draft Status */}
        {draftStatus !== 'idle' && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: 'var(--font-size-base)',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              backgroundColor:
                draftStatus === 'saved'
                  ? 'var(--color-success-light)'
                  : draftStatus === 'error'
                    ? 'var(--color-error-light)'
                    : '#f0f4ff',
              color:
                draftStatus === 'saved'
                  ? 'var(--color-success-dark)'
                  : draftStatus === 'error'
                    ? 'var(--color-error-dark)'
                    : 'var(--color-primary-dark)',
              borderLeft: '4px solid',
              borderLeftColor:
                draftStatus === 'saved'
                  ? 'var(--color-success)'
                  : draftStatus === 'error'
                    ? 'var(--color-error)'
                    : 'var(--color-primary)',
            }}
          >
            {draftStatus === 'saving' && (
              <>
                <Loader size={16} className="animate-spin" />
                Lagrer utkast…
              </>
            )}
            {draftStatus === 'saved' && (
              <>
                <CheckCircle size={16} />
                Lagret som utkast
              </>
            )}
            {draftStatus === 'error' && (
              <>
                <AlertCircle size={16} />
                {clientError && clientError.includes('relation')
                  ? 'Autosave er midlertidig utilgjengelig'
                  : 'Kunne ikke lagre utkast'}
              </>
            )}
          </div>
        )}

        {clientError && <div className="alert alert-error">{clientError}</div>}

        {/* Metadata */}
        <fieldset
          style={{
            border: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: 'var(--space-2xl)',
          }}
        >
          <legend
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: '800',
              marginBottom: 'var(--space-lg)',
              color: 'var(--color-neutral-900)',
            }}
          >
            📋 Dine opplysninger
          </legend>

          <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: 'var(--space-sm)',
                color: 'var(--color-neutral-700)',
              }}
            >
              Uke (1-53)
            </label>
            <input
              name="week"
              defaultValue={currentWeek}
              type="number"
              min={1}
              max={53}
              style={{ ...inputStyle, maxWidth: '140px' }}
              disabled={isPending}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontWeight: '700',
                marginBottom: 'var(--space-md)',
                color: 'var(--color-neutral-800)',
                fontSize: 'var(--font-size-base)',
              }}
            >
              Navn (valgfritt)
              <small
                style={{
                  display: 'block',
                  color: 'var(--color-neutral-600)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '400',
                  marginTop: 'var(--space-sm)',
                  lineHeight: 'var(--line-height-relaxed)',
                }}
              >
                Synlig for teamadmin. Huk av «Anonym» for å skjule i statistikk.
              </small>
            </label>
            <input
              name="name"
              defaultValue={initialDraft?.displayName || ''}
              type="text"
              disabled={isPending}
              style={inputStyle}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              cursor: 'pointer',
              fontWeight: '600',
              color: 'var(--color-neutral-800)',
              fontSize: 'var(--font-size-base)',
            }}
          >
            <input
              name="anon"
              type="checkbox"
              defaultChecked={initialDraft?.isAnonymous || false}
              disabled={isPending}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <Check size={18} />
            Anonym
          </label>
        </fieldset>

        {/* Questions */}
        <fieldset
          style={{
            border: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: 'var(--space-3xl)',
          }}
        >
          <legend
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: '800',
              marginBottom: 'var(--space-xl)',
              color: 'var(--color-neutral-900)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
            }}
          >
            <Target size={28} />
            Spørsmål
          </legend>

          {questions.map((q, index) => {
            const draftAnswer = initialDraft?.answers.find(
              (a) => a.question_id === q.id
            )

            return (
              <fieldset
                key={q.id}
                style={{
                  border: '2px solid var(--color-neutral-300)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: 'var(--space-2xl)',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLFieldSetElement).style.boxShadow =
                    'var(--shadow-lg)'
                  ;(e.currentTarget as HTMLFieldSetElement).style.borderColor =
                    'var(--color-primary)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLFieldSetElement).style.boxShadow =
                    'none'
                  ;(e.currentTarget as HTMLFieldSetElement).style.borderColor =
                    'var(--color-neutral-300)'
                }}
              >
                <legend
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '700',
                    marginBottom: 'var(--space-lg)',
                    color: 'var(--color-neutral-900)',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 'var(--space-md)',
                    lineHeight: 'var(--line-height-relaxed)',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--color-primary)',
                      fontWeight: '800',
                      minWidth: '40px',
                      fontSize: 'var(--font-size-lg)',
                    }}
                  >
                    {index + 1}.
                  </span>
                  {q.label}
                  {q.required && (
                    <span
                      style={{ color: 'var(--color-error)', fontWeight: '800' }}
                    >
                      *
                    </span>
                  )}
                </legend>

                {q.type === 'scale_1_5' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(100px, 1fr))',
                      gap: 'var(--space-md)',
                    }}
                  >
                    {[
                      { val: 1, emoji: '😞', label: 'Lav' },
                      { val: 2, emoji: '😕', label: 'Delvis lav' },
                      { val: 3, emoji: '😐', label: 'Middels' },
                      { val: 4, emoji: '🙂', label: 'Bra' },
                      { val: 5, emoji: '😄', label: 'Høy' },
                    ].map(({ val, emoji, label }) => (
                      <label
                        key={val}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 'var(--space-lg)',
                          borderRadius: 'var(--border-radius-lg)',
                          border:
                            selectedAnswers[q.id] === val
                              ? '3px solid var(--color-primary)'
                              : '2px solid var(--color-neutral-200)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor:
                            selectedAnswers[q.id] === val
                              ? 'var(--color-primary-light)'
                              : 'white',
                          boxShadow:
                            selectedAnswers[q.id] === val
                              ? 'var(--shadow-lg)'
                              : 'none',
                          gap: 'var(--space-sm)',
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLLabelElement
                          if (selectedAnswers[q.id] !== val) {
                            el.style.borderColor = 'var(--color-primary)'
                            el.style.backgroundColor = 'var(--color-neutral-50)'
                            el.style.transform = 'scale(1.05)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLLabelElement
                          if (selectedAnswers[q.id] !== val) {
                            el.style.borderColor = 'var(--color-neutral-200)'
                            el.style.backgroundColor = 'white'
                            el.style.transform = 'scale(1)'
                          }
                        }}
                        onClick={() =>
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [q.id]: val,
                          }))
                        }
                      >
                        <input
                          name={`q_${q.id}`}
                          value={val}
                          type="radio"
                          required={q.required}
                          disabled={isPending}
                          defaultChecked={draftAnswer?.value_num === val}
                          style={{
                            display: 'none',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '48px',
                            lineHeight: '1',
                            display: 'block',
                          }}
                        >
                          {emoji}
                        </span>
                        <span
                          style={{
                            fontWeight: '700',
                            fontSize: 'var(--font-size-sm)',
                            color:
                              selectedAnswers[q.id] === val
                                ? 'var(--color-primary)'
                                : 'var(--color-neutral-700)',
                          }}
                        >
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'yes_no' && (
                  <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    {[
                      { val: 'ja', label: 'Ja' },
                      { val: 'nei', label: 'Nei' },
                    ].map((opt) => {
                      const isSelected =
                        selectedAnswers[q.id] === (opt.val === 'ja')
                      return (
                        <label
                          key={opt.val}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--border-radius-md)',
                            border: '2px solid var(--color-neutral-200)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: isSelected
                              ? 'var(--color-primary-light)'
                              : 'white',
                            borderColor: isSelected
                              ? 'var(--color-primary)'
                              : 'var(--color-neutral-200)',
                            color: isSelected
                              ? 'var(--color-primary)'
                              : 'var(--color-neutral-900)',
                            fontWeight: isSelected ? '600' : '500',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              ;(
                                e.currentTarget as HTMLLabelElement
                              ).style.borderColor = 'var(--color-primary)'
                              ;(
                                e.currentTarget as HTMLLabelElement
                              ).style.backgroundColor =
                                'var(--color-neutral-50)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              ;(
                                e.currentTarget as HTMLLabelElement
                              ).style.borderColor = 'var(--color-neutral-200)'
                              ;(
                                e.currentTarget as HTMLLabelElement
                              ).style.backgroundColor = 'white'
                            }
                          }}
                          onClick={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt.val === 'ja',
                            }))
                          }
                        >
                          <input
                            name={`q_${q.id}`}
                            value={opt.val}
                            type="radio"
                            required={q.required}
                            disabled={isPending}
                            defaultChecked={
                              opt.val === 'ja'
                                ? draftAnswer?.value_bool === true
                                : draftAnswer?.value_bool === false
                            }
                            style={{
                              display: 'none',
                            }}
                          />
                          {opt.label}
                        </label>
                      )
                    })}
                  </div>
                )}

                {q.type === 'text' && (
                  <textarea
                    name={`q_${q.id}`}
                    defaultValue={draftAnswer?.value_text || ''}
                    style={{
                      width: '100%',
                      padding: 'var(--space-md)',
                      minHeight: '100px',
                      resize: 'vertical',
                    }}
                    disabled={isPending}
                  />
                )}
              </fieldset>
            )
          })}
        </fieldset>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: 'var(--space-md) var(--space-xl)',
            backgroundColor: isPending
              ? 'var(--color-neutral-300)'
              : 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            fontSize: 'var(--font-size-base)',
            fontWeight: '700',
            cursor: isPending ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            alignSelf: 'flex-start',
            marginTop: 'var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
          onMouseEnter={(e) => {
            if (!isPending) {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--color-primary-dark)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                'var(--shadow-lg)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isPending) {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--color-primary)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            }
          }}
        >
          {isPending ? (
            <>
              <Loader size={16} className="animate-spin" />
              Sender inn...
            </>
          ) : (
            <>
              <Send size={16} />
              Send inn
            </>
          )}
        </button>
      </form>

      {/* Mobile Sticky Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid var(--color-neutral-200)',
          boxShadow: 'var(--shadow-lg)',
          padding: 'var(--space-md)',
          paddingBottom: 'max(var(--space-md), env(safe-area-inset-bottom))',
          display: 'none',
          justifyContent: 'center',
        }}
        className="mobile-sticky-bar"
      >
        <button
          type="submit"
          form="survey-form"
          disabled={isPending}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: 'var(--space-md) var(--space-xl)',
            backgroundColor: isPending
              ? 'var(--color-neutral-300)'
              : 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            fontSize: 'var(--font-size-base)',
            fontWeight: '700',
            cursor: isPending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          {isPending ? (
            <>
              <Loader size={16} className="animate-spin" />
              Sender inn...
            </>
          ) : (
            <>
              <Send size={16} />
              Send inn
            </>
          )}
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
