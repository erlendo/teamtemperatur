'use client'

import { supabaseBrowser } from '@/lib/supabase/browser'
import { sendMagicLink } from '@/server/actions/auth'
import { Thermometer, Loader, CheckCircle, Mail } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function LoginClient() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for error in URL
    const error = searchParams.get('error')
    if (error === 'auth_failed') {
      setMsg({
        type: 'error',
        text: 'Innloggingslenken er ugyldig eller utløpt. Send en ny lenke.',
      })
    }

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
  }, [router, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    const result = await sendMagicLink(email)

    if ('error' in result) {
      setMsg({ type: 'error', text: `Feil: ${result.error}` })
    } else {
      setMsg({
        type: 'success',
        text: 'Sjekk e-posten din for innloggingslenke',
      })
      setEmail('')
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
            <Loader size={28} className="animate-spin" style={{ margin: '0 auto' }} />
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
          <p style={{ color: 'var(--color-neutral-600)' }}>
            Måle teamhelse kontinuerlig
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
            Logg inn
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
                    padding: 'var(--space-md) var(--space-md) var(--space-md) calc(var(--space-md) + 28px)',
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
              <Mail size={18} />
              Send innloggingslenke
            </button>
          </form>

          {msg && (
            <div
              className={
                msg.type === 'error'
                  ? 'alert alert-error'
                  : 'alert alert-success'
              }
              style={{ marginTop: 'var(--space-lg)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}
            >
              {msg.type === 'success' ? (
                <CheckCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : null}
              <span>{msg.text}</span>
            </div>
          )}

          <div
            style={{
              marginTop: 'var(--space-lg)',
              paddingTop: 'var(--space-lg)',
              borderTop: '1px solid var(--color-neutral-200)',
              color: 'var(--color-neutral-600)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <p style={{ margin: 0 }}>
              Vi sender en sikker innloggingslenke til e-posten din. Ingen
              passord nødvendig!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
