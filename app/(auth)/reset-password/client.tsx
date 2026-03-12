'use client'

import { supabaseBrowser } from '@/lib/supabase/browser'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Loader,
  Lock,
  ShieldCheck,
  Thermometer,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const featureHighlights = [
  'Fullfør tilbakestillingen i samme rolige flyt som resten av auth-opplevelsen',
  'Velg et nytt passord og gå raskt tilbake til teamoversikten',
  'Tydelige tilstander for lenkevalidering, lagring og ferdigstilling',
]

export function ResetPasswordClient() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [msg, setMsg] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkToken = async () => {
      const supabase = supabaseBrowser()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setValidToken(true)
      } else {
        setMsg({
          type: 'error',
          text: 'Ugyldig eller utløpt tilbakestillingslenke. Be om en ny lenke.',
        })
      }
      setCheckingToken(false)
    }

    void checkToken()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (password !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passordene matcher ikke.' })
      return
    }

    if (password.length < 6) {
      setMsg({ type: 'error', text: 'Passordet må være minst 6 tegn.' })
      return
    }

    setLoading(true)

    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      setMsg({ type: 'error', text: `Feil: ${error.message}` })
      return
    }

    setMsg({
      type: 'success',
      text: 'Passord oppdatert. Du blir sendt videre til teamoversikten.',
    })
    setTimeout(() => router.push('/teams'), 1500)
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
            Velg et nytt passord og kom raskt tilbake i flyten.
          </h1>
          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-neutral-700)',
              marginBottom: 'var(--space-xl)',
              maxWidth: '34rem',
            }}
          >
            Når lenken er validert kan du oppdatere passordet ditt og gå rett
            videre til teamets arbeidsflate.
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

        <section className="auth-card" aria-label="Nytt passord">
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
                Nytt passord
              </p>
              <h2
                style={{
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--font-size-2xl)',
                }}
              >
                Oppdater tilgangen din
              </h2>
              <p
                style={{
                  marginBottom: 0,
                  color: 'var(--color-neutral-600)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Velg et nytt passord som er enkelt for deg å huske og trygt nok
                for daglig bruk.
              </p>
            </div>
            <div className="auth-icon-panel" aria-hidden="true">
              <ShieldCheck size={20} />
            </div>
          </div>

          {checkingToken ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
              <Loader
                size={28}
                className="animate-spin"
                style={{ margin: '0 auto 1rem' }}
              />
              <p style={{ margin: 0, color: 'var(--color-neutral-600)' }}>
                Validerer lenken...
              </p>
            </div>
          ) : validToken ? (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'grid', gap: 'var(--space-lg)' }}
            >
              <div>
                <label
                  htmlFor="reset-password"
                  style={{
                    marginBottom: 'var(--space-sm)',
                    color: 'var(--color-neutral-700)',
                  }}
                >
                  Nytt passord
                </label>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Lock
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 'var(--space-md)',
                      color: 'var(--color-neutral-400)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="reset-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minst 6 tegn"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding:
                        'var(--space-md) calc(var(--space-md) + 44px) var(--space-md) calc(var(--space-md) + 28px)',
                      border: '1px solid var(--color-neutral-300)',
                      borderRadius: 'var(--border-radius-md)',
                      fontSize: 'var(--font-size-base)',
                    }}
                  />
                  <button
                    className="auth-icon-button"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Skjul passord' : 'Vis passord'}
                    style={{
                      position: 'absolute',
                      right: 'var(--space-sm)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '999px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-neutral-500)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reset-confirm-password"
                  style={{
                    marginBottom: 'var(--space-sm)',
                    color: 'var(--color-neutral-700)',
                  }}
                >
                  Bekreft nytt passord
                </label>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Lock
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 'var(--space-md)',
                      color: 'var(--color-neutral-400)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="reset-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Gjenta passordet"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding:
                        'var(--space-md) calc(var(--space-md) + 44px) var(--space-md) calc(var(--space-md) + 28px)',
                      border: '1px solid var(--color-neutral-300)',
                      borderRadius: 'var(--border-radius-md)',
                      fontSize: 'var(--font-size-base)',
                    }}
                  />
                  <button
                    className="auth-icon-button"
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    aria-label={
                      showConfirmPassword
                        ? 'Skjul bekreftet passord'
                        : 'Vis bekreftet passord'
                    }
                    style={{
                      position: 'absolute',
                      right: 'var(--space-sm)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '999px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-neutral-500)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
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
                    Lagrer nytt passord...
                  </>
                ) : (
                  <>
                    Oppdater passord
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 'var(--space-md)',
                padding: 'var(--space-lg) 0',
              }}
            >
              <p style={{ margin: 0, color: 'var(--color-neutral-600)' }}>
                Lenken er ikke lenger gyldig, eller den har utløpt.
              </p>
              <Link
                href="/forgot-password"
                style={{ color: 'var(--color-primary)', fontWeight: '600' }}
              >
                Be om en ny lenke
              </Link>
            </div>
          )}

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
              Tilbake til innlogging?{' '}
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
