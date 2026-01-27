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
  X,
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
              style={{ width: '100%', maxWidth: '120px' }}
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
                        'repeat(auto-fit, minmax(90px, 1fr))',
                      gap: 'var(--space-md)',
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label
                        key={n}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 'var(--space-md) var(--space-lg)',
                          borderRadius: 'var(--border-radius-md)',
                          border: '2px solid var(--color-neutral-300)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor:
                            draftAnswer?.value_num === n
                              ? 'var(--color-primary-light)'
                              : 'white',
                          borderColor:
                            draftAnswer?.value_num === n
                              ? 'var(--color-primary)'
                              : 'var(--color-neutral-300)',
                          fontWeight:
                            draftAnswer?.value_num === n ? '700' : '600',
                          color:
                            draftAnswer?.value_num === n
                              ? 'white'
                              : 'var(--color-neutral-900)',
                          gap: 'var(--space-xs)',
                        }}
                        onMouseEnter={(e) => {
                          if (draftAnswer?.value_num !== n) {
                            ;(
                              e.currentTarget as HTMLLabelElement
                            ).style.borderColor = 'var(--color-primary)'
                            ;(
                              e.currentTarget as HTMLLabelElement
                            ).style.backgroundColor = 'var(--color-neutral-50)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (draftAnswer?.value_num !== n) {
                            ;(
                              e.currentTarget as HTMLLabelElement
                            ).style.borderColor = 'var(--color-neutral-300)'
                            ;(
                              e.currentTarget as HTMLLabelElement
                            ).style.backgroundColor = 'white'
                          }
                        }}
                      >
                        <input
                          name={`q_${q.id}`}
                          value={n}
                          type="radio"
                          required={q.required}
                          disabled={isPending}
                          defaultChecked={draftAnswer?.value_num === n}
                          style={{
                            marginRight: 0,
                            cursor: 'pointer',
                          }}
                        />
                        {n === 1 && (
                          <>
                            <X size={16} />
                            Lav
                          </>
                        )}
                        {n === 2 && <AlertCircle size={16} />}
                        {n === 3 && <span>• Middels</span>}
                        {n === 4 && <CheckCircle size={16} />}
                        {n === 5 && (
                          <>
                            <Check size={16} />
                            Høy
                          </>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'yes_no' && (
                  <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    {[
                      { val: 'ja', label: 'Ja' },
                      { val: 'nei', label: 'Nei' },
                    ].map((opt) => (
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
                          backgroundColor:
                            draftAnswer?.value_bool === (opt.val === 'ja')
                              ? 'var(--color-primary-light)'
                              : 'white',
                          borderColor:
                            draftAnswer?.value_bool === (opt.val === 'ja')
                              ? 'var(--color-primary)'
                              : 'var(--color-neutral-200)',
                          color:
                            draftAnswer?.value_bool === (opt.val === 'ja')
                              ? 'white'
                              : 'var(--color-neutral-900)',
                          fontWeight:
                            draftAnswer?.value_bool === (opt.val === 'ja')
                              ? '600'
                              : '500',
                        }}
                        onMouseEnter={(e) => {
                          if (draftAnswer?.value_bool !== (opt.val === 'ja')) {
                            ;(
                              e.currentTarget as HTMLLabelElement
                            ).style.borderColor = 'var(--color-primary)'
                            ;(
                              e.currentTarget as HTMLLabelElement
                            ).style.backgroundColor = 'var(--color-neutral-50)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (draftAnswer?.value_bool !== (opt.val === 'ja')) {
                            ;(
                              e.currentTarget as HTMLLabelElement
                            ).style.borderColor = 'var(--color-neutral-200)'
                            ;(
                              e.currentTarget as HTMLLabelElement
                            ).style.backgroundColor = 'white'
                          }
                        }}
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
                            marginRight: 'var(--space-sm)',
                            cursor: 'pointer',
                          }}
                        />
                        {opt.label}
                      </label>
                    ))}
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
