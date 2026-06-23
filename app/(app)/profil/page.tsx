import { AppHeader } from '@/components/AppHeader'
import { ProfileForm } from '@/components/ProfileForm'
import { supabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilPage() {
  const supabase = supabaseServer()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_name, email')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <>
      <AppHeader />
      <main style={{ flex: 1, backgroundColor: 'var(--color-neutral-50)' }}>
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: 'var(--space-3xl) var(--space-md)',
            display: 'grid',
            gap: 'var(--space-2xl)',
          }}
        >
          <section
            style={{
              padding: 'var(--space-2xl)',
              borderRadius: '1.5rem',
              border: '1px solid var(--color-neutral-200)',
              background:
                'linear-gradient(180deg, var(--color-neutral-100), rgba(230, 239, 240, 0.72))',
              boxShadow: 'var(--shadow-sm)',
              display: 'grid',
              gap: 'var(--space-sm)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: 'var(--color-primary-dark)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Konto
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 800,
                color: 'var(--color-neutral-900)',
              }}
            >
              {profile?.first_name ?? user.email}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-neutral-600)',
              }}
            >
              {user.email}
            </p>
          </section>

          <ProfileForm />
        </div>
      </main>
    </>
  )
}
