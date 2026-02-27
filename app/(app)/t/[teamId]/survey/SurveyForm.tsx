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

  return (
    <>
      <form
        id="survey-form"
        action={handleSubmit}
        onChange={handleChange}
        style={{ display: 'flex', flexDirection: 'column', gap: '0' }}
      >
        {/* Draft status */}
        {draftStatus !== 'idle' && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px',
              color:
                draftStatus === 'saved'
                  ? 'var(--color-success-dark)'
                  : draftStatus === 'error'
                    ? 'var(--color-error-dark)'
                    : 'var(--color-neutral-600)',
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
              padding: '10px 14px',
              backgroundColor: 'rgba(239,68,68,0.08)',
              color: 'var(--color-error-dark, #b91c1c)',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {clientError}
          </div>
        )}

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                  padding: '20px 0',
                  borderBottom:
                    index < questions.length - 1
                      ? '1px solid var(--color-neutral-200)'
                      : 'none',
                }}
              >
                {/* Question label */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                    marginBottom: '14px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: isAnswered
                        ? 'var(--color-primary)'
                        : 'var(--color-neutral-400)',
                      minWidth: '20px',
                    }}
                  >
                    {index + 1}.
                  </span>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: 'var(--color-neutral-900)',
                      lineHeight: '1.4',
                    }}
                  >
                    {q.label}
                    {q.required && (
                      <span style={{ color: 'var(--color-error)', marginLeft: '3px' }}>
                        *
                      </span>
                    )}
                  </span>
                </div>

                {/* Scale 1-5 */}
                {q.type === 'scale_1_5' && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      paddingLeft: '28px',
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
                            gap: '4px',
                            padding: '10px 4px',
                            borderRadius: '10px',
                            border: selected
                              ? '2px solid var(--color-primary)'
                              : '2px solid var(--color-neutral-200)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            backgroundColor: selected
                              ? 'var(--color-primary-light, #e8f5f0)'
                              : 'white',
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) {
                              e.currentTarget.style.borderColor =
                                'var(--color-primary)'
                              e.currentTarget.style.backgroundColor =
                                'var(--color-neutral-50)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) {
                              e.currentTarget.style.borderColor =
                                'var(--color-neutral-200)'
                              e.currentTarget.style.backgroundColor = 'white'
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
                          <span style={{ fontSize: '24px', lineHeight: '1' }}>
                            {emoji}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: selected
                                ? 'var(--color-primary)'
                                : 'var(--color-neutral-500)',
                            }}
                          >
                            {val}
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
                      gap: '8px',
                      paddingLeft: '28px',
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
                            padding: '8px 24px',
                            borderRadius: '8px',
                            border: isSelected
                              ? '2px solid var(--color-primary)'
                              : '2px solid var(--color-neutral-200)',
                            cursor: 'pointer',
                            backgroundColor: isSelected
                              ? 'var(--color-primary-light, #e8f5f0)'
                              : 'white',
                            color: isSelected
                              ? 'var(--color-primary)'
                              : 'var(--color-neutral-700)',
                            fontWeight: isSelected ? '600' : '500',
                            fontSize: '14px',
                            transition: 'all 0.15s ease',
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
                      padding: '10px 12px',
                      minHeight: '80px',
                      resize: 'vertical',
                      border: '1px solid var(--color-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      marginLeft: '28px',
                      boxSizing: 'border-box',
                    }}
                    disabled={isPending}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Progress + Submit */}
        <div
          style={{
            marginTop: '28px',
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
              padding: '12px 28px',
              backgroundColor: isPending
                ? 'var(--color-neutral-300)'
                : 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
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
              fontSize: '13px',
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
          backgroundColor: 'white',
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
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: isPending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
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
        <span style={{ fontSize: '12px', color: 'var(--color-neutral-500)' }}>
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
