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
            maxWidth: '1000px',
            margin: '0 auto',
            padding: 'var(--space-3xl) var(--space-xl)',
          }}
        >
          <h1
            style={{
              marginBottom: 'var(--space-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              fontSize: 'var(--font-size-4xl)',
              fontWeight: '800',
              color: 'var(--color-neutral-900)',
            }}
          >
            📍 Teamoversikt
          </h1>
          <p
            style={{
              color: 'var(--color-neutral-600)',
              marginBottom: 'var(--space-3xl)',
              fontSize: 'var(--font-size-xl)',
              lineHeight: 'var(--line-height-relaxed)',
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
              gap: 'var(--space-sm)',
              color: 'var(--color-neutral-600)',
              fontWeight: '500',
              textDecoration: 'none',
              padding: 'var(--space-md)',
              transition: 'color 0.2s ease',
            }}
          >
            ← Tilbake til teams
          </Link>
        </div>
      </main>
    </>
  )
}
