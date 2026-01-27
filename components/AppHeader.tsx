import Link from 'next/link'

export function AppHeader({
  teamId,
  teamName,
}: {
  teamId?: string
  teamName?: string
}) {
  return (
    <header
      style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0',
        marginBottom: '2rem',
      }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Link
              href="/teams"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textDecoration: 'none',
                color: '#111',
              }}
            >
              Teamtemperatur
            </Link>
            {teamName && (
              <span
                style={{
                  marginLeft: '1rem',
                  color: '#6b7280',
                  fontSize: '1rem',
                }}
              >
                / {teamName}
              </span>
            )}
          </div>

          {teamId && (
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              <Link
                href={`/t/${teamId}/survey`}
                style={{ textDecoration: 'none', color: '#374151' }}
              >
                Ny måling
              </Link>
              <Link
                href={`/t/${teamId}/stats`}
                style={{ textDecoration: 'none', color: '#374151' }}
              >
                Statistikk
              </Link>
              <Link
                href="/teams"
                style={{ textDecoration: 'none', color: '#374151' }}
              >
                Mine teams
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
