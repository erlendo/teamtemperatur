'use client'

import { deleteDraft, saveDraft } from '@/server/actions/drafts'
import { submitSurvey } from '@/server/actions/submissions'
import { AlertCircle, CheckCircle, Loader, Send } from 'lucide-react'
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

const SCALE_OPTIONS = [
  { val: 1, emoji: '😞', label: 'Lav' },
  { val: 2, emoji: '😕', label: '' },
  { val: 3, emoji: '😐', label: 'Middels' },
  { val: 4, emoji: '🙂', label: '' },
  { val: 5, emoji: '😄', label: 'Høy' },
]

const QUESTION_SURFACE = {
  defaultBorder: '1px solid var(--color-neutral-200)',
  answeredBorder: '1px solid var(--color-primary)',
  defaultBackground: 'var(--color-neutral-100)',
  answeredBackground: 'var(--color-info-light)',
}

export function SurveyForm({
  teamId,
  questionnaireId,
  questions,
  currentWeek,
  maxWeek,
  initialDraft,
}: {
  teamId: string
  questionnaireId: string
  questions: Question[]
  currentWeek: number
  maxWeek: number
  initialDraft?: DraftData | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [clientError, setClientError] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<
    'saved' | 'saving' | 'idle' | 'error'
  >('idle')
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number | boolean | string | null>
  >(() => {
    const initial: Record<string, number | boolean | string | null> = {}
    initialDraft?.answers.forEach((a) => {
      if (a.value_num !== undefined && a.value_num !== null)
        initial[a.question_id] = a.value_num
      else if (a.value_bool !== undefined && a.value_bool !== null)
        initial[a.question_id] = a.value_bool
      else if (a.value_text !== undefined && a.value_text !== null)
        initial[a.question_id] = a.value_text
    })
    return initial
  })

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedSave = useCallback(
    (formData: FormData) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      setDraftStatus('saving')
      saveTimeoutRef.current = setTimeout(async () => {
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
          week: currentWeek,
          isAnonymous: false,
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
    [teamId, questionnaireId, questions, currentWeek]
  )

  const handleChange = (e: React.FormEvent<HTMLFormElement>) => {
    debouncedSave(new FormData(e.currentTarget))
  }

  const handleSubmit = async (formData: FormData) => {
    setClientError(null)
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
        week: currentWeek,
        isAnonymous: false,
        answers,
      })
      if ('error' in result) {
        setClientError(result.error || 'En ukjent feil oppstod')
      } else {
        await deleteDraft(teamId, currentWeek)
        router.push(`/t/${teamId}/survey?submitted=true&week=${currentWeek}`)
      }
    })
  }

  const answeredCount = questions.filter(
    (q) => selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== null
  ).length
  const progressPercent =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0

  return (
    <>
      <form
        id="survey-form"
        action={handleSubmit}
        onChange={handleChange}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-neutral-100)',
            border: '1px solid var(--color-neutral-200)',
            borderRadius: '1rem',
            padding: 'var(--space-md)',
            display: 'grid',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-md)',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p
                style={{
                  marginBottom: 'var(--space-xs)',
                  color: 'var(--color-primary-dark)',
                  fontWeight: 700,
                  fontSize: 'var(--font-size-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Fremdrift
              </p>
              <p
                style={{
                  marginBottom: 0,
                  color: 'var(--color-neutral-600)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {answeredCount} av {questions.length} spørsmål besvart
              </p>
            </div>
            <div
              style={{
                color: 'var(--color-neutral-700)',
                fontWeight: 700,
                fontSize: 'var(--font-size-base)',
              }}
            >
              {progressPercent}%
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '999px',
                backgroundColor: 'var(--color-teal-soft)',
                color: 'var(--color-primary-dark)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
              }}
            >
              Ett trykk per spørsmål
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '999px',
                backgroundColor: 'var(--color-neutral-50)',
                color: 'var(--color-neutral-600)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
              }}
            >
              Utkast lagres automatisk
            </span>
          </div>
          <div
            style={{
              height: '8px',
              borderRadius: '999px',
              backgroundColor: 'var(--color-sand)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: '999px',
                background:
                  'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>

        {/* Draft status */}
        {draftStatus !== 'idle' && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: '10px 14px',
              borderRadius: '999px',
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              alignSelf: 'flex-start',
              color:
                draftStatus === 'saved'
                  ? 'var(--color-success-dark)'
                  : draftStatus === 'error'
                    ? 'var(--color-error-dark)'
                    : 'var(--color-neutral-600)',
              backgroundColor:
                draftStatus === 'saved'
                  ? 'var(--color-success-light)'
                  : draftStatus === 'error'
                    ? 'var(--color-error-light)'
                    : 'var(--color-neutral-100)',
              border:
                draftStatus === 'saved'
                  ? '1px solid var(--color-moss)'
                  : draftStatus === 'error'
                    ? '1px solid var(--color-bark)'
                    : '1px solid var(--color-neutral-200)',
            }}
          >
            {draftStatus === 'saving' && (
              <>
                <Loader size={13} className="animate-spin" />
                Lagrer…
              </>
            )}
            {draftStatus === 'saved' && (
              <>
                <CheckCircle size={13} />
                Lagret
              </>
            )}
            {draftStatus === 'error' && (
              <>
                <AlertCircle size={13} />
                Kunne ikke lagre utkast
              </>
            )}
          </div>
        )}

        {clientError && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-error-light)',
              color: 'var(--color-error-dark)',
              borderRadius: 'var(--border-radius-lg)',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid var(--color-bark)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} />
            {clientError}
          </div>
        )}

        {/* Week selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-neutral-600)',
            backgroundColor: 'var(--color-neutral-100)',
            border: '1px solid var(--color-neutral-200)',
            borderRadius: '999px',
            padding: '10px 14px',
            alignSelf: 'flex-start',
          }}
        >
          {currentWeek > maxWeek - 4 && currentWeek > 1 && (
            <a
              href={`/t/${teamId}/survey?week=${currentWeek - 1}`}
              style={{
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              ← Forrige uke
            </a>
          )}
          <span>
            Uke {currentWeek}
            {currentWeek === maxWeek ? ' (denne uken)' : ''}
          </span>
          {currentWeek < maxWeek && (
            <a
              href={`/t/${teamId}/survey?week=${currentWeek + 1}`}
              style={{
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Neste uke →
            </a>
          )}
        </div>

        {/* Questions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
          }}
        >
          {questions.map((q, index) => {
            const draftAnswer = initialDraft?.answers.find(
              (a) => a.question_id === q.id
            )
            const isAnswered =
              selectedAnswers[q.id] !== undefined &&
              selectedAnswers[q.id] !== null

            return (
              <div
                key={q.id}
                style={{
                  padding: 'var(--space-lg)',
                  border: isAnswered
                    ? QUESTION_SURFACE.answeredBorder
                    : QUESTION_SURFACE.defaultBorder,
                  borderRadius: '1rem',
                  backgroundColor: isAnswered
                    ? QUESTION_SURFACE.answeredBackground
                    : QUESTION_SURFACE.defaultBackground,
                  boxShadow: isAnswered ? 'var(--shadow-sm)' : 'none',
                  display: 'grid',
                  gap: 'var(--space-md)',
                }}
              >
                {/* Question label */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                    marginBottom: 'var(--space-md)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '700',
                      color: isAnswered
                        ? 'var(--color-primary-dark)'
                        : 'var(--color-neutral-400)',
                      minWidth: '28px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '28px',
                      borderRadius: '999px',
                      backgroundColor: isAnswered
                        ? 'var(--color-teal-soft)'
                        : 'var(--color-canvas)',
                      border: isAnswered
                        ? '1px solid rgba(92, 143, 149, 0.2)'
                        : '1px solid var(--color-sand)',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      color: 'var(--color-neutral-900)',
                      lineHeight: 'var(--line-height-tight)',
                    }}
                  >
                    {q.label}
                    {q.required && (
                      <span
                        style={{
                          color: 'var(--color-error)',
                          marginLeft: '3px',
                        }}
                      >
                        *
                      </span>
                    )}
                  </span>
                </div>

                {/* Scale 1-5 */}
                {q.type === 'scale_1_5' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {SCALE_OPTIONS.map(({ val, emoji, label }) => {
                      const selected = selectedAnswers[q.id] === val
                      return (
                        <label
                          key={val}
                          title={label || String(val)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '14px 8px',
                            minHeight: '88px',
                            borderRadius: '14px',
                            border: selected
                              ? '2px solid var(--color-primary)'
                              : '2px solid var(--color-neutral-200)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            backgroundColor: selected
                              ? 'var(--color-teal-soft)'
                              : 'var(--color-porcelain)',
                            boxShadow: selected ? 'var(--shadow-sm)' : 'none',
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) {
                              e.currentTarget.style.borderColor =
                                'var(--color-primary)'
                              e.currentTarget.style.backgroundColor =
                                'var(--color-canvas)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) {
                              e.currentTarget.style.borderColor =
                                'var(--color-neutral-200)'
                              e.currentTarget.style.backgroundColor =
                                'var(--color-porcelain)'
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
                            style={{ display: 'none' }}
                          />
                          <span style={{ fontSize: '28px', lineHeight: '1' }}>
                            {emoji}
                          </span>
                          <span
                            style={{
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: '600',
                              color: selected
                                ? 'var(--color-primary-dark)'
                                : 'var(--color-neutral-500)',
                            }}
                          >
                            {label || val}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* Yes/No */}
                {q.type === 'yes_no' && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
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
                            padding: '14px 24px',
                            minWidth: '136px',
                            justifyContent: 'center',
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: '12px',
                            border: isSelected
                              ? '2px solid var(--color-primary)'
                              : '2px solid var(--color-neutral-200)',
                            cursor: 'pointer',
                            backgroundColor: isSelected
                              ? 'var(--color-teal-soft)'
                              : 'var(--color-porcelain)',
                            color: isSelected
                              ? 'var(--color-primary-dark)'
                              : 'var(--color-neutral-700)',
                            fontWeight: isSelected ? '600' : '500',
                            fontSize: 'var(--font-size-sm)',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
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
                            style={{ display: 'none' }}
                          />
                          {opt.label}
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* Text */}
                {q.type === 'text' && (
                  <textarea
                    name={`q_${q.id}`}
                    defaultValue={draftAnswer?.value_text || ''}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      minHeight: '120px',
                      resize: 'vertical',
                      border: '1px solid var(--color-neutral-300)',
                      borderRadius: '12px',
                      fontSize: 'var(--font-size-sm)',
                      boxSizing: 'border-box',
                      backgroundColor: 'var(--color-porcelain)',
                      color: 'var(--color-neutral-800)',
                      lineHeight: 'var(--line-height-normal)',
                    }}
                    disabled={isPending}
                    placeholder="Skriv kort hvis du vil utdype"
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Progress + Submit */}
        <div
          style={{
            marginTop: 'var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '14px 28px',
              backgroundColor: isPending
                ? 'var(--color-neutral-300)'
                : 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '700',
              cursor: isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isPending ? 'none' : 'var(--shadow-sm)',
            }}
          >
            {isPending ? (
              <>
                <Loader size={15} className="animate-spin" />
                Sender inn...
              </>
            ) : (
              <>
                <Send size={15} />
                Send inn
              </>
            )}
          </button>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-neutral-500)',
            }}
          >
            {answeredCount} av {questions.length} besvart
          </span>
        </div>
      </form>

      {/* Mobile sticky bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-neutral-100)',
          borderTop: '1px solid var(--color-neutral-200)',
          padding: '12px 16px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          display: 'none',
          alignItems: 'center',
          gap: '12px',
        }}
        className="mobile-sticky-bar"
      >
        <button
          type="submit"
          form="survey-form"
          disabled={isPending}
          style={{
            flex: 1,
            maxWidth: '320px',
            padding: '12px',
            backgroundColor: isPending
              ? 'var(--color-neutral-300)'
              : 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '700',
            cursor: isPending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: isPending ? 'none' : 'var(--shadow-sm)',
          }}
        >
          {isPending ? (
            <>
              <Loader size={15} className="animate-spin" />
              Sender inn...
            </>
          ) : (
            <>
              <Send size={15} />
              Send inn
            </>
          )}
        </button>
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-neutral-500)',
          }}
        >
          {answeredCount}/{questions.length}
        </span>
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
