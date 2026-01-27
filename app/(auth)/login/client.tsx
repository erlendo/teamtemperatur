'use client'

import { supabaseBrowser } from '@/lib/supabase/browser'
import { sendMagicLink } from '@/server/actions/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function LoginClient() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for error in URL
    const error = searchParams.get('error')
    if (error === 'auth_failed') {
      setMsg('Innloggingslenken er ugyldig eller utløpt. Send en ny lenke.')
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

    checkAuth()
  }, [router, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    const result = await sendMagicLink(email)

    if ('error' in result) {
      setMsg(`Feil: ${result.error}`)
    } else {
      setMsg('Sjekk e-post for innloggingslenke.')
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 420 }}>
        <p>Sjekker innlogging...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h1>Logg inn</h1>
      <form onSubmit={handleSubmit}>
        <label>E-post</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: 10, marginTop: 6 }}
          type="email"
          required
        />
        <button style={{ marginTop: 12, padding: '10px 14px' }}>
          Send innloggingslenke
        </button>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  )
}
