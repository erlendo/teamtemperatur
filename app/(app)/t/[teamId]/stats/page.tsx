import { AppHeader } from '@/components/AppHeader'
import { YearStatsView } from '@/components/YearStatsView'
import { getYearStats } from '@/server/actions/stats'

function currentWeekNumberSimple() {
  const d = new Date()
  const start = new Date(d.getFullYear(), 0, 1)
  const days = Math.floor((d.getTime() - start.getTime()) / 86400000)
  return Math.ceil((days + start.getDay() + 1) / 7)
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const currentWeek = currentWeekNumberSimple()

  let stats: Awaited<ReturnType<typeof getYearStats>> = []
  try {
    stats = await getYearStats(teamId, currentWeek)
  } catch (error) {
    console.error('Error fetching stats:', error)
    stats = []
  }

  return (
    <>
      <AppHeader teamId={teamId} />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-3xl) var(--space-md)' }}>
          <h1 style={{ marginBottom: 'var(--space-lg)' }}>📊 Statistikk</h1>

          {stats.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-3xl) var(--space-2xl)',
                textAlign: 'center',
                backgroundColor: 'white',
                border: '2px dashed var(--color-neutral-300)',
                borderRadius: 'var(--border-radius-lg)',
                marginTop: 'var(--space-2xl)',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: 'var(--space-lg)' }}>📈</div>
              <h2 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-neutral-900)' }}>
                Ingen data ennå
              </h2>
              <p
                style={{
                  color: 'var(--color-neutral-600)',
                  marginBottom: 'var(--space-xl)',
                  maxWidth: '500px',
                  margin: '0 auto var(--space-xl)',
                }}
              >
                Send inn din første måling for å se statistikk, trends og gjennomsnitt over tid.
              </p>
              <a
                href={`/t/${teamId}/survey`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-md) var(--space-xl)',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: 'var(--border-radius-md)',
                  fontWeight: '700',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-primary-dark)'
                  ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'var(--shadow-lg)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-primary)'
                  ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
                }}
              >
                📝 Gå til ny måling
              </a>
            </div>
          ) : (
            <YearStatsView data={stats} />
          )}

          <div style={{ marginTop: 'var(--space-3xl)' }}>
            <a
              href={`/t/${teamId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                color: 'var(--color-primary)',
                fontWeight: '500',
                textDecoration: 'none',
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--border-radius-md)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-neutral-100)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
              }}
            >
              ← Tilbake til team
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
