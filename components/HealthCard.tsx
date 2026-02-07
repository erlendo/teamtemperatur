'use client'

import Link from 'next/link'
import { useState } from 'react'

type WeekStat = {
  week: number
  overall_avg: number
  bayesian_adjusted: number
  moving_average: number
  response_count: number
  member_count: number
  response_rate: number
  question_stats?: Array<{
    question_key: string
    question_label: string
    sort_order: number
    avg_score: number
    count: number
  }>
}

interface HealthCardProps {
  teamId: string
  currentWeek: number
  overallAvg: number
  responseRate: number
  responseCount: number
  memberCount: number
  previousWeekAvg?: number
  statsData?: WeekStat[]
}

export function HealthCard({
  teamId,
  currentWeek,
  overallAvg,
  responseRate,
  responseCount,
  memberCount,
  previousWeekAvg,
  statsData = [],
}: HealthCardProps) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null)

  // Get available weeks from stats data (only weeks with actual data)
  const availableWeeks = statsData
    .filter((s) => s.overall_avg && s.overall_avg > 0) // Only weeks with real data
    .sort((a, b) => a.week - b.week)
    .slice(-6) // Last 6 weeks with data
    .map((s) => ({ week: s.week, avg: s.overall_avg }))

  const getTrendIcon = () => {
    if (!previousWeekAvg) return '→'
    const diff = overallAvg - previousWeekAvg
    if (diff > 0.2) return '↗️'
    if (diff < -0.2) return '↘️'
    return '→'
  }

  const getTrendText = () => {
    if (!previousWeekAvg) return ''
    const diff = overallAvg - previousWeekAvg
    if (Math.abs(diff) < 0.1) return ''
    return diff > 0
      ? `+${diff.toFixed(1)} fra forrige uke`
      : `${diff.toFixed(1)} fra forrige uke`
  }

  const getHealthColor = () => {
    if (overallAvg >= 4.0) return 'var(--color-success, #22c55e)'
    if (overallAvg >= 3.0) return 'var(--color-warning, #eab308)'
    return 'var(--color-error, #ef4444)'
  }

  // Generate SVG points for trend chart
  const generateTrendPoints = () => {
    if (availableWeeks.length === 0) return ''
    const firstWeek = availableWeeks[0]
    if (!firstWeek) return ''
    if (availableWeeks.length === 1) {
      return `${0},${100 - (firstWeek.avg / 5) * 100}`
    }

    const width = 100
    const height = 100
    const spacing = width / (availableWeeks.length - 1)

    return availableWeeks
      .map((w, i) => {
        if (!w) return ''
        const x = i * spacing
        const y = height - (w.avg / 5) * height
        return `${x},${y}`
      })
      .filter((p) => p)
      .join(' ')
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg, 0.5rem)',
        padding: 'var(--space-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-neutral-200, #e5e5e5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 'var(--font-size-sm, 0.875rem)',
          fontWeight: 600,
          color: 'var(--color-neutral-600)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Denne uka (Uke {currentWeek})
      </h3>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-sm)',
        }}
      >
        <span
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: getHealthColor(),
          }}
        >
          ● {overallAvg.toFixed(1)}
        </span>
        <span
          style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-neutral-500)',
          }}
        >
          / 5.0
        </span>
        {previousWeekAvg && (
          <span
            style={{
              fontSize: 'var(--font-size-lg)',
              marginLeft: 'auto',
            }}
          >
            {getTrendIcon()}
          </span>
        )}
      </div>

      {getTrendText() && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-neutral-600)',
          }}
        >
          {getTrendText()}
        </p>
      )}

      {/* Trend Chart */}
      {availableWeeks.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-neutral-50, #fafafa)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            marginTop: 'var(--space-md)',
            position: 'relative',
          }}
        >
          <p
            style={{
              margin: '0 0 var(--space-sm) 0',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'var(--color-neutral-600)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Trend ({availableWeeks.length} uker)
          </p>
          <div style={{ position: 'relative', width: '100%' }}>
            <svg
              width="100%"
              height="160"
              viewBox="0 -40 100 160"
              style={{ display: 'block', overflow: 'visible' }}
              preserveAspectRatio="none"
            >
              {/* Baseline */}
              <line
                x1="0"
                y1="100"
                x2="100"
                y2="100"
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />

              {/* Trend line */}
              <polyline
                points={generateTrendPoints()}
                fill="none"
                stroke="#10b981"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points - without tooltip text (text moved outside SVG) */}
              {availableWeeks.map((w, i) => {
                const spacing =
                  availableWeeks.length > 1
                    ? 100 / (availableWeeks.length - 1)
                    : 50
                const x = availableWeeks.length > 1 ? i * spacing : 50
                const y = 100 - (w.avg / 5) * 100
                return (
                  <g key={w.week}>
                    {/* Larger invisible hit area for easier mouseover */}
                    <circle
                      cx={x}
                      cy={y}
                      r="7"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredWeek(w.week)}
                      onMouseLeave={() => setHoveredWeek(null)}
                    />
                    {/* Visible data point */}
                    <circle cx={x} cy={y} r="2" fill="#10b981" />
                  </g>
                )
              })}
            </svg>

            {/* HTML-based tooltips (outside SVG, not affected by scaling) */}
            {hoveredWeek && availableWeeks.map((w) => {
              if (hoveredWeek !== w.week) return null
              
              const spacing =
                availableWeeks.length > 1
                  ? 100 / (availableWeeks.length - 1)
                  : 50
              const i = availableWeeks.indexOf(w)
              const xPercent = availableWeeks.length > 1 ? (i * spacing) : 50
              const y = 100 - (w.avg / 5) * 100
              const yPercent = -40 + y - 35

              return (
                <div
                  key={`tooltip-${w.week}`}
                  style={{
                    position: 'absolute',
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                    transform: 'translate(-50%, 0)',
                    pointerEvents: 'none',
                    backgroundColor: 'var(--color-neutral-900)',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                    Uke {w.week}
                  </div>
                  <div style={{ color: '#10b981', fontSize: '16px', fontWeight: '700' }}>
                    {w.avg.toFixed(1)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div
        style={{
          padding: 'var(--space-md)',
          backgroundColor: 'var(--color-neutral-50, #fafafa)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-neutral-700)',
          }}
        >
          <strong>Svar:</strong> {responseCount} av {memberCount} (
          {responseRate.toFixed(0)}%)
        </p>
      </div>

      <Link
        href={`/t/${teamId}/stats`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          color: 'var(--color-primary, #3b82f6)',
          textDecoration: 'none',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 500,
        }}
      >
        Se detaljert statistikk →
      </Link>
    </div>
  )
}
