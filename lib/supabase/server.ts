import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function supabaseServer() {
  const cookieStore = cookies()

  // Use SERVICE_ROLE_KEY for server-side queries to bypass RLS
  // RLS policies are checked on the client side via supabaseClient()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey || anonKey!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (
          cs: Array<{
            name: string
            value: string
            options?: Record<string, unknown>
          }>
        ) => cs.forEach((c) => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )
}
