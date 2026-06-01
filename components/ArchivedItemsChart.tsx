'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ArchivedTrendPoint = {
  weekStart: string
  label: string
  count: number
}

type ArchivedItemsChartProps = {
  data: ArchivedTrendPoint[]
  teamName?: string | null
}

function formatDateLabel(weekStart: string): string {
  const date = new Date(weekStart)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
}

function ArchiveTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ArchivedTrendPoint; value: number }>
}) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div
      style={{
        background: 'var(--color-canvas)',
        border: '1px solid var(--color-neutral-200)',
        borderRadius: 'var(--border-radius-md)',
        boxShadow: 'var(--shadow-md)',
        padding: 'var(--space-sm) var(--space-md)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-neutral-500)',
          marginBottom: '2px',
        }}
      >
        Uke som startet {formatDateLabel(point.weekStart)} kl. 10:00
      </div>
      <div
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 700,
          color: 'var(--color-neutral-900)',
        }}
      >
        {point.count} arkiverte saker
      </div>
    </div>
  )
}

export function ArchivedItemsChart({
  data,
  teamName,
}: ArchivedItemsChartProps) {
  const totalArchived = data.reduce((sum, point) => sum + point.count, 0)
  const hasData = data.some((point) => point.count > 0)

  return (
    <section
      style={{
        marginBottom: 'var(--space-2xl)',
        padding: 'var(--space-2xl)',
        borderRadius: '1.25rem',
        background:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 240, 231, 0.94))',
        border: '1px solid var(--color-neutral-200)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
          alignItems: 'baseline',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 var(--space-xs) 0',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 700,
              color: 'var(--color-primary-dark)',
            }}
          >
            Arkivering
          </p>
          <h2
            style={{
              margin: 0,
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              color: 'var(--color-neutral-900)',
              letterSpacing: '-0.02em',
            }}
          >
            Arkiverte saker per uke
          </h2>
          <p
            style={{
              margin: 'var(--space-xs) 0 0 0',
              color: 'var(--color-neutral-600)',
            }}
          >
            Viser de siste 12 ukene{teamName ? ` for ${teamName}` : ''}. Uken
            går fra mandag kl. 10:00 til neste mandag kl. 10:00 Oslo-tid.
          </p>
        </div>

        <div
          style={{
            minWidth: '12rem',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: '999px',
            background: 'rgba(96, 139, 148, 0.12)',
            color: 'var(--color-primary-dark)',
            fontWeight: 700,
          }}
        >
          {totalArchived} arkiverte totalt
        </div>
      </div>

      {hasData ? (
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                stroke="var(--color-neutral-200)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: 'var(--color-neutral-200)' }}
                tick={{ fill: 'var(--color-neutral-500)', fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-neutral-200)' }}
                tick={{ fill: 'var(--color-neutral-500)', fontSize: 12 }}
              />
              <Tooltip content={<ArchiveTooltip />} />
              <Bar
                dataKey="count"
                fill="var(--color-primary)"
                radius={[8, 8, 0, 0]}
                maxBarSize={34}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          style={{
            padding: 'var(--space-xl)',
            borderRadius: 'var(--border-radius-md)',
            background: 'var(--color-neutral-50)',
            border: '1px dashed var(--color-neutral-200)',
            color: 'var(--color-neutral-600)',
          }}
        >
          Ingen arkiverte saker i denne perioden ennå.
        </div>
      )}
    </section>
  )
}
