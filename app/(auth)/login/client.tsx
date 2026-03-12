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
  Mail,
  ShieldCheck,
  Thermometer,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const featureHighlights = [
  'Ukentlig temperaturmåling med lav terskel for deltakelse',
  'Felles dashboard for mål, pipeline, ukemål og retro',
  'Tydelige trender som gjør det enklere å oppdage endringer tidlig',
]

export function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [msg, setMsg] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'auth_failed') {
      setMsg({
        type: 'error',
        text: 'Innloggingslenken er ugyldig eller utløpt. Send en ny lenke.',
      })
    }

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
  }, [router, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setIsSubmitting(true)

    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      const friendlyMessage =
        error.message === 'Invalid login credentials'
          ? 'E-post eller passord stemmer ikke. Prøv igjen.'
          : `Feil: ${error.message}`
      setMsg({ type: 'error', text: friendlyMessage })
      setIsSubmitting(false)
      return
    }

    setMsg({
      type: 'success',
      text: 'Innlogging vellykket. Sender deg videre til teamoversikten...',
    })
    router.push('/teams')
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
              Forbereder innlogging...
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
            Få oversikt over teamhelsen uten å miste flyten.
          </h1>
          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-neutral-700)',
              marginBottom: 'var(--space-xl)',
              maxWidth: '34rem',
            }}
          >
            Samle ukentlige signaler, knytt dem til teamets arbeid og gjør
            oppfølgingen mer konkret fra uke til uke.
          </p>

          <div className="auth-feature-list" aria-label="Fordeler">
            {featureHighlights.map((feature) => (
              <div key={feature} className="auth-feature-item">
                <CheckCircle size={18} />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="auth-kpi-row" aria-label="Produktfordeler">
            <div className="auth-kpi-card">
              <span className="auth-kpi-label">Ukerytme</span>
              <strong>Lav terskel</strong>
              <span>Rask innsjekk for hele teamet</span>
            </div>
            <div className="auth-kpi-card">
              <span className="auth-kpi-label">Oppfølging</span>
              <strong>Mer konkret</strong>
              <span>Koble signaler til mål og retro</span>
            </div>
          </div>
        </section>

        <section className="auth-card" aria-label="Innlogging">
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
                Logg inn
              </p>
              <h2
                style={{
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--font-size-2xl)',
                }}
              >
                Fortsett der teamet slapp
              </h2>
              <p
                style={{
                  marginBottom: 0,
                  color: 'var(--color-neutral-600)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Bruk e-postadressen din for å åpne dashboard, undersøkelser og
                oppfølging.
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
                htmlFor="login-email"
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
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="din@epost.com"
                  autoComplete="email"
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
                htmlFor="login-password"
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
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ditt passord"
                  autoComplete="current-password"
                  required
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
              <p
                style={{
                  marginTop: 'var(--space-sm)',
                  marginBottom: 0,
                  color: 'var(--color-neutral-500)',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                Bruk samme innlogging som du har fått tilgang til via teamet.
              </p>
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
                  Logger inn...
                </>
              ) : (
                <>
                  Logg inn
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: 'var(--space-md)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 'var(--space-md)',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color: 'var(--color-neutral-500)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              Problemer med å logge inn?
            </span>
            <Link
              href="/forgot-password"
              style={{
                color: 'var(--color-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Nullstill passord
            </Link>
          </div>

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
                  style={{
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                />
              ) : (
                <AlertCircle
                  size={20}
                  style={{
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
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
              Har du ikke konto ennå?{' '}
              <Link
                href="/signup"
                style={{ color: 'var(--color-primary)', fontWeight: '600' }}
              >
                Opprett bruker
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
