'use client'

import { supabaseBrowser } from '@/lib/supabase/browser'
import { CheckCircle, Lock, Thermometer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function ResetPasswordClient() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if there's a valid recovery token in the URL
    const checkToken = async () => {
      const supabase = supabaseBrowser()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // If there's a session from the recovery link, we can proceed
      if (session) {
        setValidToken(true)
      } else {
        setMsg({
          type: 'error',
          text: 'Ugyldig eller utløpt tilbakestillingslenke. Be om en ny lenke.',
        })
      }
    }

    void checkToken()
  }, [])

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

    setLoading(true)

    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    setLoading(false)

    if (error) {
      setMsg({ type: 'error', text: `Feil: ${error.message}` })
    } else {
      setMsg({
        type: 'success',
        text: 'Passord oppdatert! Videresender til teams...',
      })
      setTimeout(() => router.push('/teams'), 2000)
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
          <p style={{ color: 'var(--color-neutral-600)' }}>Velg nytt passord</p>
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
            Nytt passord
          </h2>

          {validToken ? (
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Minst 6 tegn"
                    required
                    minLength={6}
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

              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    placeholder="Gjenta passordet"
                    required
                    minLength={6}
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
                <Lock size={18} />
                {loading ? 'Lagrer...' : 'Oppdater passord'}
              </button>
            </form>
          ) : (
            <div
              style={{
                padding: 'var(--space-lg)',
                textAlign: 'center',
                color: 'var(--color-neutral-600)',
              }}
            >
              <p>Laster...</p>
            </div>
          )}

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
        </div>
      </div>
    </div>
  )
}
