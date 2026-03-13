'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type QuestionStat = {
  question_key: string
  question_label: string
  sort_order: number
  avg_score: number
  count: number
}

type WeekData = {
  week: number
  overall_avg: number
  bayesian_adjusted: number
  moving_average: number
  response_count: number
  member_count: number
  response_rate: number
  question_stats: QuestionStat[]
}

type YearStatsViewProps = {
  data: WeekData[]
  teamId: string
  selectedWeekNumber?: number
}

const CHART_COLORS = {
  raw: 'var(--color-bark)',
  bayesian: 'var(--color-primary)',
  moving: 'var(--color-secondary)',
  response: 'var(--color-clay)',
  grid: 'var(--color-sand)',
}

export function YearStatsView({
  data,
  teamId: _teamId,
  selectedWeekNumber,
}: YearStatsViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [shouldRenderQuestionCharts, setShouldRenderQuestionCharts] =
    useState(false)
  const questionSectionRef = useRef<HTMLDivElement | null>(null)

  const weeksWithResponses = data.filter(
    (week) =>
      week.response_count > 0 &&
      week.question_stats &&
      week.question_stats.length > 0 &&
      week.overall_avg > 0
  )

  const selectableWeeks =
    weeksWithResponses.length > 0 ? weeksWithResponses : data

  // Initialize selectedWeekIndex based on selectedWeekNumber prop
  const getInitialWeekIndex = () => {
    if (selectedWeekNumber) {
      const index = selectableWeeks.findIndex(
        (w) => w.week === selectedWeekNumber
      )
      if (index !== -1) return index
    }
    return Math.max(selectableWeeks.length - 1, 0)
  }

  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(
    getInitialWeekIndex()
  )

  // Update selectedWeekIndex when selectedWeekNumber changes
  useEffect(() => {
    if (selectedWeekNumber) {
      const index = selectableWeeks.findIndex(
        (w) => w.week === selectedWeekNumber
      )
      if (index !== -1 && index !== selectedWeekIndex) {
        setSelectedWeekIndex(index)
      }
    }
  }, [selectedWeekNumber, selectableWeeks, selectedWeekIndex])

  useEffect(() => {
    if (!questionSectionRef.current || shouldRenderQuestionCharts) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRenderQuestionCharts(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '240px 0px',
      }
    )

    observer.observe(questionSectionRef.current)

    return () => observer.disconnect()
  }, [shouldRenderQuestionCharts])

  const selectedWeek =
    selectableWeeks.length > 0 ? selectableWeeks[selectedWeekIndex] : null
  const previousWeek =
    selectedWeekIndex > 0 ? selectableWeeks[selectedWeekIndex - 1] : null

  const handleWeekSelect = (week: WeekData, index: number) => {
    setSelectedWeekIndex(index)

    // Update URL with week parameter
    const params = new URLSearchParams(searchParams.toString())
    params.set('week', week.week.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const delta =
    selectedWeek && previousWeek
      ? (selectedWeek.overall_avg - previousWeek.overall_avg).toFixed(2)
      : null

  // Transform data for main chart - only show weeks with responses
  const chartData = weeksWithResponses.map((w) => ({
    week: w.week,
    råscore: Number(w.overall_avg.toFixed(2)),
    bayesiansk: Number(w.bayesian_adjusted.toFixed(2)),
    glidende: Number(w.moving_average.toFixed(2)),
    svarprosent: Number(w.response_rate.toFixed(1)),
  }))

  // Get unique questions from selected week
  const questions =
    selectedWeek?.question_stats?.sort((a, b) => a.sort_order - b.sort_order) ||
    []

  // Get question trend data for each question - only weeks with responses
  const getQuestionTrend = (questionKey: string) => {
    return weeksWithResponses.map((w) => {
      const qStat = w.question_stats?.find(
        (q) => q.question_key === questionKey
      )
      return {
        week: w.week,
        score: qStat ? Number(qStat.avg_score.toFixed(2)) : null,
      }
    })
  }

  const getQuestionDelta = (questionKey: string) => {
    if (!selectedWeek || !previousWeek) return null
    const curr = selectedWeek.question_stats?.find(
      (q) => q.question_key === questionKey
    )
    const prev = previousWeek.question_stats?.find(
      (q) => q.question_key === questionKey
    )
    if (!curr || !prev) return null
    return (curr.avg_score - prev.avg_score).toFixed(2)
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2xl)' }}>
      {/* Week Selector */}
      <div
        style={{
          display: 'grid',
          gap: 'var(--space-sm)',
        }}
      >
        <p
          style={{
            margin: 0,
            color: 'var(--color-neutral-600)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Velg uke for detaljvisning
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {selectableWeeks.map((week, idx) => (
            <button
              key={week.week}
              onClick={() => handleWeekSelect(week, idx)}
              style={{
                padding: '0.625rem 1rem',
                backgroundColor:
                  idx === selectedWeekIndex
                    ? 'var(--color-primary)'
                    : 'var(--color-neutral-100)',
                color:
                  idx === selectedWeekIndex
                    ? 'white'
                    : 'var(--color-neutral-700)',
                border:
                  idx === selectedWeekIndex
                    ? '1px solid var(--color-primary)'
                    : '1px solid var(--color-neutral-200)',
                borderRadius: 999,
                cursor: 'pointer',
                fontWeight: idx === selectedWeekIndex ? '600' : '400',
                fontSize: 'var(--font-size-xs)',
                boxShadow:
                  idx === selectedWeekIndex ? 'var(--shadow-sm)' : 'none',
              }}
            >
              Uke {week.week}
            </button>
          ))}
        </div>
      </div>

      {/* Current Week Summary */}
      {selectedWeek && (
        <div
          style={{
            padding: 'var(--space-xl)',
            backgroundColor: 'var(--color-neutral-100)',
            border: '1px solid var(--color-neutral-200)',
            borderRadius: '1rem',
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-neutral-500)',
              }}
            >
              Inneværende uke
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'bold',
                color: 'var(--color-neutral-900)',
              }}
            >
              Uke {selectedWeek.week}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-neutral-500)',
              }}
            >
              Teamhelse (Bayesiansk)
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'bold',
                color: 'var(--color-neutral-900)',
              }}
            >
              {selectedWeek.bayesian_adjusted.toFixed(2)}
              {delta && (
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    marginLeft: '0.5rem',
                    color:
                      Number(delta) >= 0
                        ? 'var(--color-success-dark)'
                        : 'var(--color-error-dark)',
                  }}
                >
                  {Number(delta) >= 0 ? '↑' : '↓'} {Math.abs(Number(delta))}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-neutral-500)',
              }}
            >
              Råscore: {selectedWeek.overall_avg.toFixed(2)} · Glidende:{' '}
              {selectedWeek.moving_average.toFixed(2)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-neutral-500)',
              }}
            >
              Svarprosent
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'bold',
                color: 'var(--color-neutral-900)',
              }}
            >
              {selectedWeek.response_rate.toFixed(0)}%
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-neutral-500)',
              }}
            >
              {selectedWeek.response_count} av {selectedWeek.member_count}{' '}
              medlemmer
            </div>
          </div>
        </div>
      )}

      {/* Main Year Chart */}
      <div
        style={{
          padding: 'var(--space-xl)',
          borderRadius: '1rem',
          border: '1px solid var(--color-neutral-200)',
          backgroundColor: 'var(--color-neutral-100)',
        }}
      >
        <h2
          style={{
            marginBottom: '1rem',
            color: 'var(--color-neutral-900)',
            fontSize: 'var(--font-size-xl)',
          }}
        >
          Årsoversikt
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="week"
              label={{ value: 'Uke', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              yAxisId="left"
              label={{
                value: 'Helse (1-5)',
                angle: -90,
                position: 'insideLeft',
              }}
              domain={[0, 5]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: 'Svarprosent (%)',
                angle: 90,
                position: 'insideRight',
              }}
              domain={[0, 100]}
            />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="råscore"
              name="Råscore"
              stroke={CHART_COLORS.raw}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="bayesiansk"
              name="Bayesiansk justert"
              stroke={CHART_COLORS.bayesian}
              strokeWidth={3}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="glidende"
              name="Glidende gjennomsnitt"
              stroke={CHART_COLORS.moving}
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="svarprosent"
              name="Svarprosent"
              stroke={CHART_COLORS.response}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Question Cards Grid */}
      <div
        ref={questionSectionRef}
        style={{ display: 'grid', gap: 'var(--space-md)' }}
      >
        <h2
          style={{
            marginBottom: 0,
            color: 'var(--color-neutral-900)',
            fontSize: 'var(--font-size-xl)',
          }}
        >
          Spørsmål
        </h2>
        <p
          style={{
            margin: 0,
            color: 'var(--color-neutral-600)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Detaljgrafer lastes først når du kommer ned til denne delen.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '1rem',
          }}
        >
          {questions.map((q) => {
            const trend = shouldRenderQuestionCharts
              ? getQuestionTrend(q.question_key)
              : []
            const qDelta = getQuestionDelta(q.question_key)
            const isExpanded = expandedQuestion === q.question_key

            return (
              <div key={q.question_key}>
                <button
                  onClick={() => {
                    setShouldRenderQuestionCharts(true)
                    setExpandedQuestion(isExpanded ? null : q.question_key)
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid var(--color-neutral-200)',
                    borderRadius: '1rem',
                    backgroundColor: 'var(--color-neutral-100)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    boxShadow: isExpanded ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-neutral-700)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {q.question_label}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 'bold',
                        color: 'var(--color-neutral-900)',
                      }}
                    >
                      {q.avg_score.toFixed(2)}
                      {qDelta && (
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            marginLeft: '0.5rem',
                            color:
                              Number(qDelta) >= 0
                                ? 'var(--color-success-dark)'
                                : 'var(--color-error-dark)',
                          }}
                        >
                          {Number(qDelta) >= 0 ? '↑' : '↓'}{' '}
                          {Math.abs(Number(qDelta))}
                        </span>
                      )}
                    </div>
                    {/* Sparkline */}
                    <div style={{ width: 80, height: 40 }}>
                      {shouldRenderQuestionCharts ? (
                        <ResponsiveContainer>
                          <AreaChart data={trend}>
                            <Area
                              type="monotone"
                              dataKey="score"
                              stroke={CHART_COLORS.bayesian}
                              fill={CHART_COLORS.bayesian}
                              fillOpacity={0.3}
                              strokeWidth={2}
                              dot={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '999px',
                            background:
                              'linear-gradient(90deg, var(--color-neutral-100), var(--color-sand), var(--color-neutral-100))',
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-neutral-500)',
                    }}
                  >
                    {q.count} svar · Klikk for detaljer
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && shouldRenderQuestionCharts && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      border: '1px solid var(--color-neutral-200)',
                      borderRadius: '1rem',
                      backgroundColor: 'var(--color-neutral-50)',
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: '1rem',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-neutral-800)',
                      }}
                    >
                      Siste 52 uker
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart
                        data={data.map((w) => {
                          const qStat = w.question_stats?.find(
                            (qs) => qs.question_key === q.question_key
                          )
                          return {
                            week: w.week,
                            score: qStat
                              ? Number(qStat.avg_score.toFixed(2))
                              : null,
                          }
                        })}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={CHART_COLORS.grid}
                        />
                        <XAxis dataKey="week" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="score"
                          name={q.question_label}
                          fill={CHART_COLORS.bayesian}
                          stroke={CHART_COLORS.bayesian}
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
