import { supabaseServer } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getSafeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/teams'
  }

  return value
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const tokenType = request.nextUrl.searchParams.get('type')
  const next = getSafeNextPath(request.nextUrl.searchParams.get('next'))
  const supabase = supabaseServer()

  if (!code && !(tokenHash && tokenType)) {
    const url = new URL('/login', request.url)
    url.searchParams.set('error', 'auth_failed')
    return NextResponse.redirect(url)
  }

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: tokenType as 'email' | 'recovery' | 'invite' | 'email_change',
      })
  if (error) {
    console.error('[AuthCallback] exchangeCodeForSession error:', error)
    const url = new URL('/login', request.url)
    url.searchParams.set('error', 'auth_failed')
    return NextResponse.redirect(url)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
