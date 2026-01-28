import { listAvailableTeams, listMyTeams } from '@/server/actions/teams'
import { TeamsList } from './client'

export const dynamic = 'force-dynamic'

export default async function TeamsPage() {
  let myTeams
  let availableTeams
  try {
    myTeams = await listMyTeams()
    availableTeams = await listAvailableTeams()
  } catch (error) {
    console.error('[TeamsPage] Error loading teams:', error)
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-neutral-50)',
          padding: 'var(--space-xl)',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: 'white',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--color-error-light)',
            boxShadow: 'var(--shadow-md)',
            padding: 'var(--space-xl)',
          }}
        >
          <h1
            style={{
              marginBottom: 'var(--space-md)',
              color: 'var(--color-error)',
            }}
          >
            Teknisk feil
          </h1>
          <p
            style={{
              color: 'var(--color-neutral-700)',
              marginBottom: 'var(--space-lg)',
            }}
          >
            Kunne ikke laste teams:{' '}
            {error instanceof Error ? error.message : 'Ukjent feil'}
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-md) var(--space-lg)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              borderRadius: 'var(--border-radius-md)',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Prøv innlogging på nytt
          </a>
        </div>
      </div>
    )
  }

  if (myTeams === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-neutral-50)',
          padding: 'var(--space-xl)',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: 'white',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--color-neutral-200)',
            boxShadow: 'var(--shadow-md)',
            padding: 'var(--space-xl)',
          }}
        >
          <h1 style={{ marginBottom: 'var(--space-md)' }}>
            Du er ikke innlogget
          </h1>
          <p
            style={{
              color: 'var(--color-neutral-700)',
              marginBottom: 'var(--space-lg)',
            }}
          >
            Vi finner ingen aktiv Supabase-session. Logg inn på nytt med den
            nyeste magiske lenken.
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-md) var(--space-lg)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              borderRadius: 'var(--border-radius-md)',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Gå til innlogging
          </a>
        </div>
      </div>
    )
  }

  return (
    <TeamsList myTeams={myTeams ?? []} availableTeams={availableTeams ?? []} />
  )
}
