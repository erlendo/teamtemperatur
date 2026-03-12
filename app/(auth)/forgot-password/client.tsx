'use client'

import { supabaseBrowser } from '@/lib/supabase/browser'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader,
  Mail,
  ShieldCheck,
  Thermometer,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const featureHighlights = [
  'Behold samme rolige flyt når noen mister tilgangen sin',
  'Send en ny lenke uten å måtte kontakte administrator først',
  'Kom raskt tilbake til teamoversikt, målinger og oppfølging',
]

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
      return
    }

    setMsg({
      type: 'success',
      text: 'Sjekk e-posten din for en lenke til å tilbakestille passordet.',
    })
    setEmail('')
  }

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb-primary" />
      <div className="auth-orb auth-orb-secondary" />
      <div className="auth-grid">
        <section className="auth-hero" aria-label="Introduksjon">
          <div className="auth-badge">
            <Thermometer size={16} />
            Teamtemperatur
          </div>
          <h1 style={{ marginBottom: 'var(--space-md)' }}>
            Få tilgang igjen uten å miste momentum.
          </h1>
          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-neutral-700)',
              marginBottom: 'var(--space-xl)',
              maxWidth: '34rem',
            }}
          >
            Send en ny tilbakestillingslenke til e-postadressen din og kom raskt
            tilbake til teamets arbeidsflate.
          </p>

          <div className="auth-feature-list" aria-label="Fordeler">
            {featureHighlights.map((feature) => (
              <div key={feature} className="auth-feature-item">
                <CheckCircle size={18} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="auth-card" aria-label="Tilbakestill passord">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 'var(--space-md)',
              marginBottom: 'var(--space-xl)',
            }}
          >
            <div>
              <p
                style={{
                  marginBottom: 'var(--space-xs)',
                  color: 'var(--color-primary-dark)',
                  fontWeight: 700,
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Glemt passord
              </p>
              <h2
                style={{
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--font-size-2xl)',
                }}
              >
                Be om ny innloggingslenke
              </h2>
              <p
                style={{
                  marginBottom: 0,
                  color: 'var(--color-neutral-600)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Skriv inn e-postadressen din, så sender vi deg en trygg lenke
                for å opprette et nytt passord.
              </p>
            </div>
            <div className="auth-icon-panel" aria-hidden="true">
              <ShieldCheck size={20} />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'grid', gap: 'var(--space-lg)' }}
          >
            <div>
              <label
                htmlFor="forgot-email"
                style={{
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
                  id="forgot-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
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
              className="auth-submit-button"
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
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Sender lenke...
                </>
              ) : (
                <>
                  Send tilbakestillingslenke
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {msg && (
            <div
              role={msg.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
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
              ) : (
                <AlertCircle
                  size={20}
                  style={{ flexShrink: 0, marginTop: '2px' }}
                />
              )}
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
        </section>
      </div>
    </div>
  )
}
