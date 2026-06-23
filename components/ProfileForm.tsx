'use client'

import { updatePassword } from '@/server/actions/auth'
import { useState } from 'react'

export function ProfileForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Passordene er ikke like' })
      return
    }
    if (newPassword.length < 8) {
      setFeedback({
        type: 'error',
        message: 'Passordet må være minst 8 tegn',
      })
      return
    }
    setLoading(true)
    setFeedback(null)
    const result = await updatePassword(newPassword)
    setLoading(false)
    if (result.error) {
      setFeedback({ type: 'error', message: result.error })
    } else {
      setFeedback({ type: 'success', message: 'Passordet er oppdatert' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <section
      style={{
        padding: 'var(--space-2xl)',
        borderRadius: '1.5rem',
        border: '1px solid var(--color-neutral-200)',
        background: 'var(--color-neutral-50)',
        display: 'grid',
        gap: 'var(--space-lg)',
      }}
    >
      <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 'var(--font-size-xl)',
            fontWeight: 700,
            color: 'var(--color-neutral-900)',
          }}
        >
          Endre passord
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-neutral-600)',
          }}
        >
          Sett et nytt passord for kontoen din.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'grid', gap: 'var(--space-md)' }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <label
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-neutral-700)',
            }}
          >
            Nytt passord
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minst 8 tegn"
            required
            disabled={loading}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              border: '1px solid var(--color-neutral-300)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <label
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-neutral-700)',
            }}
          >
            Bekreft passord
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Gjenta passordet"
            required
            disabled={loading}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              border: '1px solid var(--color-neutral-300)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
            }}
          />
        </div>

        {feedback && (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-sm)',
              color:
                feedback.type === 'success'
                  ? 'var(--color-success-dark)'
                  : 'var(--color-error-dark)',
              fontWeight: 500,
            }}
          >
            {feedback.type === 'success' ? '✓ ' : '⚠ '}
            {feedback.message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !newPassword || !confirmPassword}
          style={{
            padding: 'var(--space-sm) var(--space-lg)',
            backgroundColor:
              loading || !newPassword || !confirmPassword
                ? 'var(--color-neutral-300)'
                : 'var(--color-primary)',
            color:
              loading || !newPassword || !confirmPassword
                ? 'var(--color-neutral-600)'
                : 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            cursor:
              loading || !newPassword || !confirmPassword
                ? 'not-allowed'
                : 'pointer',
            justifySelf: 'start',
          }}
        >
          {loading ? 'Lagrer...' : 'Oppdater passord'}
        </button>
      </form>
    </section>
  )
}
