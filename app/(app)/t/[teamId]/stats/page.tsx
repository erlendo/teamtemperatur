import { getWeekStats } from '@/server/actions/stats'

function currentWeekNumberSimple() {
  const d = new Date()
  const start = new Date(d.getFullYear(), 0, 1)
  const days = Math.floor((d.getTime() - start.getTime()) / 86400000)
  return Math.ceil((days + start.getDay() + 1) / 7)
}

export default async function StatsPage({ params, searchParams }: any) {
  const teamId = params.teamId as string
  const week = Number(searchParams?.week ?? currentWeekNumberSimple())
  const stats = await getWeekStats(teamId, week)

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Statistikk</h1>

      <form
        method="get"
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <label>Uke</label>
        <input
          name="week"
          defaultValue={week}
          type="number"
          min={1}
          max={53}
          style={{ width: 120, padding: 10 }}
        />
        <button style={{ padding: '10px 14px' }}>Vis</button>
      </form>

      {stats.length === 0 ? (
        <p>Ingen data for uke {week}.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                  padding: 8,
                }}
              >
                Spørsmål
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                  padding: 8,
                }}
              >
                Snitt
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                  padding: 8,
                }}
              >
                Antall
              </th>
            </tr>
          </thead>
          <tbody>
            {stats.map((r) => (
              <tr key={r.question_key}>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
                  {r.question_label || r.question_key}
                </td>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
                  {Number(r.avg_score).toFixed(2)}
                </td>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
                  {r.n_answers}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 14 }}>
        <a href={`/t/${teamId}`}>← Til team</a>
      </p>
    </div>
  )
}
