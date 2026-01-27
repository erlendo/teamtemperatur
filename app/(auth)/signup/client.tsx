'use client'

import { supabaseBrowser } from '@/lib/supabase/browser'
import { Loader, Lock, Mail, Thermometer, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function SignupClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
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

    if (password !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passordene matcher ikke' })
      return
    }

    if (password.length < 6) {
      setMsg({ type: 'error', text: 'Passordet må være minst 6 tegn' })
      return
    }

    const supabase = supabaseBrowser()
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signupError) {
      setMsg({ type: 'error', text: `Feil: ${signupError.message}` })
      return
    }

    // After signup, automatically sign in the user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setMsg({
        type: 'error',
        text: `Konto opprettet, men innlogging feilet: ${signInError.message}. Prøv å logge inn manuelt.`,
      })
    } else {
      setMsg({
        type: 'success',
        text: 'Konto opprettet og du er logget inn! Videresender...',
      })
      // Navigate to teams after successful login
      setTimeout(() => router.push('/teams'), 1500)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <Loader
              size={28}
              className="animate-spin"
              style={{ margin: '0 auto' }}
            />
          </div>
          <p style={{ color: 'var(--color-neutral-600)' }}>
            Sjekker innlogging...
          </p>
        </div>
      </div>
    )
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
          <p style={{ color: 'var(--color-neutral-600)' }}>Opprett din konto</p>
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
            Registrer deg
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
                style={{
                  display: 'block',
                  fontWeight: '600',
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Minst 6 tegn"
                  required
                  minLength={6}
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
                style={{
                  display: 'block',
                  fontWeight: '600',
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="Gjenta passordet"
                  required
                  minLength={6}
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
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius-md)',
                fontWeight: '700',
                fontSize: 'var(--font-size-base)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'var(--color-primary-dark)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                  'var(--shadow-lg)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'var(--color-primary)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
              }}
            >
              <User size={18} />
              Opprett konto
            </button>
          </form>

          {msg && (
            <div
              className={
                msg.type === 'error'
                  ? 'alert alert-error'
                  : 'alert alert-success'
              }
              style={{ marginTop: 'var(--space-lg)' }}
            >
              {msg.text}
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
        </div>
      </div>
    </div>
  )
}
