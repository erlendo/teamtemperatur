'use client'

import { cancelInvitation, inviteToTeam } from '@/server/actions/teams'
import { Mail, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Invitation {
  id: string
  email: string
  created_at: string
  expires_at: string
}

interface InviteFormProps {
  teamId: string
  pendingInvitations: Invitation[]
}

export function InviteForm({ teamId, pendingInvitations }: InviteFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setFeedback(null)
    const result = await inviteToTeam(teamId, email.trim())
    setSending(false)
    if (result.error) {
      setFeedback({ type: 'error', message: result.error })
    } else {
      setFeedback({
        type: 'success',
        message: `Invitasjon sendt til ${email.trim()}`,
      })
      setEmail('')
      router.refresh()
    }
  }

  async function handleCancel(invitationId: string) {
    setCancelling(invitationId)
    await cancelInvitation(teamId, invitationId)
    setCancelling(null)
    router.refresh()
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
          Inviter nye medlemmer
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-neutral-600)',
          }}
        >
          Personen mottar en e-post med en lenke for å opprette konto og bli med
          i teamet.
        </p>
      </div>

      <form
        onSubmit={handleInvite}
        style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="navn@eksempel.no"
          required
          disabled={sending}
          style={{
            flex: '1 1 200px',
            padding: 'var(--space-sm) var(--space-md)',
            border: '1px solid var(--color-neutral-300)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={sending || !email.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            padding: 'var(--space-sm) var(--space-lg)',
            backgroundColor:
              sending || !email.trim()
                ? 'var(--color-neutral-300)'
                : 'var(--color-primary)',
            color:
              sending || !email.trim() ? 'var(--color-neutral-600)' : 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            cursor: sending || !email.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          <Mail size={14} />
          {sending ? 'Sender...' : 'Send invitasjon'}
        </button>
      </form>

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

      {pendingInvitations.length > 0 && (
        <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-neutral-500)',
            }}
          >
            Ventende invitasjoner
          </p>
          {pendingInvitations.map((inv) => (
            <div
              key={inv.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'var(--color-neutral-100)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                gap: 'var(--space-sm)',
              }}
            >
              <span style={{ color: 'var(--color-neutral-800)' }}>
                {inv.email}
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-neutral-500)',
                  flexShrink: 0,
                }}
              >
                Utløper{' '}
                {new Date(inv.expires_at).toLocaleDateString('nb-NO', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <button
                onClick={() => handleCancel(inv.id)}
                disabled={cancelling === inv.id}
                title="Trekk tilbake invitasjon"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: cancelling === inv.id ? 'not-allowed' : 'pointer',
                  color: 'var(--color-neutral-500)',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
