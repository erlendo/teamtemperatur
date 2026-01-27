import { AppHeader } from '@/components/AppHeader'
import { TeamHomeCards } from '@/components/TeamHomeCards'
import Link from 'next/link'

export default async function TeamHome({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params

  return (
    <>
      <AppHeader teamId={teamId} />
      <main style={{ flex: 1, backgroundColor: 'var(--color-neutral-50)' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: 'var(--space-3xl) var(--space-xl)',
          }}
        >
          <h1
            style={{
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              fontSize: 'var(--font-size-4xl)',
              fontWeight: '900',
              color: 'var(--color-neutral-900)',
              letterSpacing: '-0.02em',
            }}
          >
            📍 Teamoversikt
          </h1>
          <p
            style={{
              color: 'var(--color-neutral-700)',
              marginBottom: 'var(--space-3xl)',
              fontSize: 'var(--font-size-xl)',
              lineHeight: 'var(--line-height-relaxed)',
              maxWidth: '600px',
            }}
          >
            Velg en aktivitet for å komme i gang
          </p>

          <TeamHomeCards teamId={teamId} />

          {/* Back Link */}
          <Link
            href="/teams"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              color: 'var(--color-primary)',
              fontWeight: '600',
              textDecoration: 'none',
              padding: 'var(--space-md) var(--space-lg)',
              marginTop: 'var(--space-3xl)',
              transition: 'color 0.2s ease',
              fontSize: 'var(--font-size-base)',
            }}
          >
            ← Tilbake til teams
          </Link>
        </div>
      </main>
    </>
  )
}
