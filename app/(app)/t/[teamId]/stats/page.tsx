import { getYearStats } from '@/server/actions/stats'
import { AppHeader } from '@/components/AppHeader'
import { YearStatsView } from '@/components/YearStatsView'

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
  const stats = await getYearStats(teamId, currentWeek)

  return (
    <>
      <AppHeader teamId={teamId} />
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
        <h1>Statistikk</h1>

        {stats.length === 0 ? (
          <div
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              marginTop: '2rem',
            }}
          >
            <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
              Ingen data ennå
            </p>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Send inn din første måling for å se statistikk og trender.
            </p>
            <a
              href={`/t/${teamId}/survey`}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              Gå til Ny måling
            </a>
          </div>
        ) : (
          <YearStatsView data={stats} />
        )}

        <p style={{ marginTop: '2rem' }}>
          <a href={`/t/${teamId}`}>← Til team</a>
        </p>
      </div>
    </>
  )
}
