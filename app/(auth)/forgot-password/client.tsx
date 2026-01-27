'use client'

import { supabaseBrowser } from '@/lib/supabase/browser'
import { CheckCircle, Mail, Thermometer } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function ForgotPasswordClient() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setLoading(true)

    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      setMsg({ type: 'error', text: `Feil: ${error.message}` })
    } else {
      setMsg({
        type: 'success',
        text: 'Sjekk e-posten din for en lenke til å tilbakestille passordet.',
      })
      setEmail('')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-neutral-50)',
      }}
    >
      <div
        style={{ maxWidth: '420px', width: '100%', padding: 'var(--space-lg)' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--border-radius-lg)',
              background:
                'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              marginBottom: 'var(--space-lg)',
              color: 'white',
            }}
          >
            <Thermometer size={32} />
          </div>
          <h1 style={{ marginBottom: 'var(--space-sm)' }}>Teamtemperatur</h1>
          <p style={{ color: 'var(--color-neutral-600)' }}>
            Tilbakestill passordet ditt
          </p>
        </div>

        {/* Form Card */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--color-neutral-200)',
            padding: 'var(--space-xl)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <h2
            style={{
              marginBottom: 'var(--space-lg)',
              fontSize: 'var(--font-size-xl)',
            }}
          >
            Glemt passord
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'grid', gap: 'var(--space-lg)' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: 'var(--space-sm)',
                  color: 'var(--color-neutral-700)',
                }}
              >
                E-postadresse
              </label>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 'var(--space-md)',
                    color: 'var(--color-neutral-400)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="din@epost.com"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding:
                      'var(--space-md) var(--space-md) var(--space-md) calc(var(--space-md) + 28px)',
                    border: '1px solid var(--color-neutral-300)',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 'var(--font-size-base)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                backgroundColor: loading
                  ? 'var(--color-neutral-300)'
                  : 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius-md)',
                fontWeight: '700',
                fontSize: 'var(--font-size-base)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  ;(
                    e.currentTarget as HTMLButtonElement
                  ).style.backgroundColor = 'var(--color-primary-dark)'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                    'var(--shadow-lg)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  ;(
                    e.currentTarget as HTMLButtonElement
                  ).style.backgroundColor = 'var(--color-primary)'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                    'none'
                }
              }}
            >
              <Mail size={18} />
              {loading ? 'Sender...' : 'Send tilbakestillingslenke'}
            </button>
          </form>

          {msg && (
            <div
              className={
                msg.type === 'error'
                  ? 'alert alert-error'
                  : 'alert alert-success'
              }
              style={{
                marginTop: 'var(--space-lg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-sm)',
              }}
            >
              {msg.type === 'success' ? (
                <CheckCircle
                  size={20}
                  style={{ flexShrink: 0, marginTop: '2px' }}
                />
              ) : null}
              <span>{msg.text}</span>
            </div>
          )}

          <div
            style={{
              marginTop: 'var(--space-lg)',
              paddingTop: 'var(--space-lg)',
              borderTop: '1px solid var(--color-neutral-200)',
              textAlign: 'center',
              color: 'var(--color-neutral-600)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <p style={{ margin: 0 }}>
              Husker du passordet?{' '}
              <Link
                href="/login"
                style={{ color: 'var(--color-primary)', fontWeight: '600' }}
              >
                Logg inn
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
