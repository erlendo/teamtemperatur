import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (
          cs: Array<{
            name: string
            value: string
            options?: Record<string, unknown>
          }>
        ) => cs.forEach((c) => res.cookies.set(c.name, c.value, c.options)),
      },
    }
  )

  // Handle OTP callback from magic link - exchange code for session
  const code = req.nextUrl.searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error(
        '[Middleware] exchangeCodeForSession error:',
        error.message,
        error.status
      )
      // Redirect to login with error message
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.delete('code')
      url.searchParams.set('error', 'auth_failed')
      return NextResponse.redirect(url)
    } else {
      console.log(
        '[Middleware] OTP exchange successful for:',
        req.nextUrl.pathname
      )
    }
  }

  // Refresh session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    console.log('[Middleware] User authenticated:', user.email)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
