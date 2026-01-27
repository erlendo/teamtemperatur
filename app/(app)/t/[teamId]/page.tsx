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
      <main style={{ flex: 1 }}>
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: 'var(--space-3xl) var(--space-md)',
          }}
        >
          <h1
            style={{
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}
          >
            📍 Teamoversikt
          </h1>
          <p
            style={{
              color: 'var(--color-neutral-600)',
              marginBottom: 'var(--space-2xl)',
              fontSize: 'var(--font-size-lg)',
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
              color: 'var(--color-primary)',
              fontWeight: '500',
              textDecoration: 'none',
            }}
          >
            ← Tilbake til teams
          </Link>
        </div>
      </main>
    </>
  )
}
