import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export function supabaseServer() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (
          cs: Array<{
            name: string
            value: string
            options?: Record<string, unknown>
          }>
        ) => {
          try {
            cs.forEach((c) => cookieStore.set(c.name, c.value, c.options))
          } catch {
            // Called from a Server Component — middleware handles session refresh
          }
        },
      },
    }
  )
}
