'use client'

import { supabaseBrowser } from '@/lib/supabase/browser'
import { saveUserProfile } from '@/server/actions/auth'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Loader,
  Lock,
  Mail,
  ShieldCheck,
  Thermometer,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const featureHighlights = [
  'Inviter teamet inn i samme rytme for temperaturmåling og oppfølging',
  'Samle mål, pipeline, ukemål og retro i én rolig arbeidsflate',
  'Gi nye medlemmer en raskere vei inn i teamets arbeidsflyt',
]

export function SignupClient() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [msg, setMsg] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = supabaseBrowser()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        router.push('/teams')
      } else {
        setLoading(false)
      }
    }

    void checkAuth()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (!firstName.trim()) {
      setMsg({ type: 'error', text: 'Fornavn er påkrevd.' })
      return
    }

    if (password !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passordene matcher ikke.' })
      return
    }

    if (password.length < 6) {
      setMsg({ type: 'error', text: 'Passordet må være minst 6 tegn.' })
      return
    }

    setIsSubmitting(true)

    const supabase = supabaseBrowser()
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/teams`,
      },
    })

    if (signupError) {
      setMsg({ type: 'error', text: `Feil: ${signupError.message}` })
      setIsSubmitting(false)
      return
    }

    if (data.user) {
      await saveUserProfile(firstName.trim())
    }

    if (data.user && !data.session) {
      setMsg({
        type: 'success',
        text: 'Konto opprettet. Sjekk e-posten din og bekreft kontoen før du logger inn.',
      })
      setIsSubmitting(false)
      return
    }

    if (data.session) {
      setMsg({
        type: 'success',
        text: 'Konto opprettet. Du blir sendt videre til teamoversikten.',
      })
      router.push('/teams')
    }
  }

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="auth-grid">
          <div className="auth-hero">
            <div className="auth-badge">
              <Thermometer size={16} />
              Teamtemperatur
            </div>
            <p style={{ color: 'var(--color-neutral-600)' }}>
              Sjekker innlogging...
            </p>
          </div>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <Loader
              size={28}
              className="animate-spin"
              style={{ margin: '0 auto 1rem' }}
            />
            <p style={{ margin: 0, color: 'var(--color-neutral-600)' }}>
              Forbereder registrering...
            </p>
          </div>
        </div>
      </div>
    )
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
            Opprett en konto og kom rett inn i teamets arbeidsflyt.
          </h1>
          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-neutral-700)',
              marginBottom: 'var(--space-xl)',
              maxWidth: '34rem',
            }}
          >
            Få tilgang til målinger, oppfølging og samarbeidsflaten som holder
            teamet samlet rundt det som faktisk betyr noe.
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

        <section className="auth-card" aria-label="Registrering">
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
                Opprett konto
              </p>
              <h2
                style={{
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--font-size-2xl)',
                }}
              >
                Start med det grunnleggende
              </h2>
              <p
                style={{
                  marginBottom: 0,
                  color: 'var(--color-neutral-600)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Registrer deg med navn, e-post og passord. Du kan deretter gå
                rett til teamoversikten eller bekrefte e-posten din.
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
                htmlFor="signup-first-name"
                style={{
                  marginBottom: 'var(--space-sm)',
                  color: 'var(--color-neutral-700)',
                }}
              >
                Fornavn
              </label>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <User
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 'var(--space-md)',
                    color: 'var(--color-neutral-400)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="signup-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  type="text"
                  autoComplete="given-name"
                  placeholder="f.eks. Erlend"
                  required
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

            <div>
              <label
                htmlFor="signup-email"
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
                  id="signup-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="din@epost.com"
                  required
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

            <div>
              <label
                htmlFor="signup-password"
                style={{
                  marginBottom: 'var(--space-sm)',
                  color: 'var(--color-neutral-700)',
                }}
              >
                Passord
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
                  id="signup-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Minst 6 tegn"
                  required
                  minLength={6}
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
                htmlFor="signup-confirm-password"
                style={{
                  marginBottom: 'var(--space-sm)',
                  color: 'var(--color-neutral-700)',
                }}
              >
                Bekreft passord
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
                  id="signup-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Gjenta passordet"
                  required
                  minLength={6}
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
                  onClick={() => setShowConfirmPassword((current) => !current)}
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
              disabled={isSubmitting}
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius-md)',
                fontWeight: '700',
                fontSize: 'var(--font-size-base)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)',
                opacity: isSubmitting ? 0.8 : 1,
              }}
              onMouseEnter={(e) => {
                if (isSubmitting) return
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'var(--color-primary-dark)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                  'var(--shadow-lg)'
              }}
              onMouseLeave={(e) => {
                if (isSubmitting) return
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'var(--color-primary)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Oppretter konto...
                </>
              ) : (
                <>
                  Opprett konto
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
              Har du allerede konto?{' '}
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
