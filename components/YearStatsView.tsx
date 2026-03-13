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

type BinaryWeekSignal = {
  week: number
  question_key: string
  question_label: string
  sort_order: number
  yes_count: number
  no_count: number
  response_count: number
  yes_rate: number
}

type YearStatsViewProps = {
  data: WeekData[]
  binaryData: BinaryWeekSignal[]
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

function getBinarySignalConfig(questionKey: string) {
  if (questionKey === 'obstacles') {
    return {
      eyebrow: 'Friksjon',
      helper: 'Lavere andel ja er bedre her.',
      background: 'var(--color-clay-soft)',
      border: 'rgba(200, 152, 105, 0.45)',
      accent: 'var(--color-clay)',
      accentDark: 'var(--color-espresso)',
      chartFill: 'rgba(200, 152, 105, 0.22)',
      goodDirection: 'down' as const,
    }
  }

  return {
    eyebrow: 'Læring',
    helper: 'Høyere andel ja er et godt tegn.',
    background: 'var(--color-moss-soft)',
    border: 'rgba(144, 161, 122, 0.45)',
    accent: 'var(--color-moss)',
    accentDark: 'var(--color-success-dark)',
    chartFill: 'rgba(144, 161, 122, 0.22)',
    goodDirection: 'up' as const,
  }
}

export function YearStatsView({
  data,
  binaryData,
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
    [...(selectedWeek?.question_stats ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ) || []

  const binarySignalsForSelectedWeek = selectedWeek
    ? [
        ...binaryData.filter((signal) => signal.week === selectedWeek.week),
      ].sort((a, b) => a.sort_order - b.sort_order)
    : []

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

  const getBinaryTrend = (questionKey: string) => {
    return [...binaryData]
      .filter((signal) => signal.question_key === questionKey)
      .sort((a, b) => a.week - b.week)
      .map((signal) => ({
        week: signal.week,
        rate: Number(signal.yes_rate.toFixed(1)),
      }))
  }

  const getBinaryDelta = (questionKey: string) => {
    if (!selectedWeek || !previousWeek) return null

    const currentSignal = binaryData.find(
      (signal) =>
        signal.week === selectedWeek.week && signal.question_key === questionKey
    )
    const previousSignal = binaryData.find(
      (signal) =>
        signal.week === previousWeek.week && signal.question_key === questionKey
    )

    if (!currentSignal || !previousSignal) return null
    return Number((currentSignal.yes_rate - previousSignal.yes_rate).toFixed(1))
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

      {selectedWeek && (
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          <h2
            style={{
              marginBottom: 0,
              color: 'var(--color-neutral-900)',
              fontSize: 'var(--font-size-xl)',
            }}
          >
            Ukens signaler
          </h2>
          <p
            style={{
              margin: 0,
              color: 'var(--color-neutral-600)',
              fontSize: 'var(--font-size-sm)',
              maxWidth: '42rem',
            }}
          >
            Ja/nei-spørsmål vises separat som andel ja og antall svar, slik at
            de ikke blandes med 1-5-scorene.
          </p>
          {binarySignalsForSelectedWeek.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                gap: '1rem',
              }}
            >
              {binarySignalsForSelectedWeek.map((signal) => {
                const config = getBinarySignalConfig(signal.question_key)
                const trend = getBinaryTrend(signal.question_key)
                const deltaValue = getBinaryDelta(signal.question_key)
                const isImproving =
                  deltaValue === null
                    ? null
                    : config.goodDirection === 'up'
                      ? deltaValue >= 0
                      : deltaValue <= 0

                return (
                  <article
                    key={`${signal.week}-${signal.question_key}`}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '1rem',
                      border: `1px solid ${config.border}`,
                      backgroundColor: config.background,
                      display: 'grid',
                      gap: '0.875rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'grid', gap: '0.375rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: config.accentDark,
                          }}
                        >
                          {config.eyebrow}
                        </span>
                        <h3
                          style={{
                            margin: 0,
                            color: 'var(--color-neutral-900)',
                            fontSize: 'var(--font-size-lg)',
                            lineHeight: 'var(--line-height-tight)',
                          }}
                        >
                          {signal.question_label}
                        </h3>
                      </div>
                      <div style={{ width: 96, height: 48, flexShrink: 0 }}>
                        <ResponsiveContainer>
                          <AreaChart data={trend}>
                            <Area
                              type="monotone"
                              dataKey="rate"
                              stroke={config.accent}
                              fill={config.chartFill}
                              strokeWidth={2}
                              dot={false}
                              fillOpacity={1}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--font-size-3xl)',
                          fontWeight: 900,
                          color: 'var(--color-neutral-900)',
                          letterSpacing: '-0.03em',
                        }}
                      >
                        {signal.yes_rate.toFixed(0)}%
                      </div>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 700,
                          color:
                            isImproving === null
                              ? 'var(--color-neutral-500)'
                              : isImproving
                                ? 'var(--color-success-dark)'
                                : 'var(--color-error-dark)',
                        }}
                      >
                        {deltaValue === null
                          ? 'Ingen forrige uke'
                          : `${deltaValue >= 0 ? '↑' : '↓'} ${Math.abs(deltaValue).toFixed(0)} pp`}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-neutral-700)',
                      }}
                    >
                      {signal.yes_count} av {signal.response_count} svarte ja
                    </div>

                    <div
                      style={{
                        height: '0.7rem',
                        borderRadius: 999,
                        backgroundColor: 'rgba(255, 255, 255, 0.55)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${signal.yes_rate}%`,
                          minWidth: signal.yes_rate > 0 ? '0.7rem' : 0,
                          height: '100%',
                          borderRadius: 999,
                          backgroundColor: config.accent,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-neutral-600)',
                      }}
                    >
                      <span>{config.helper}</span>
                      <span>{signal.no_count} svarte nei</span>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div
              style={{
                padding: 'var(--space-lg)',
                borderRadius: '1rem',
                border: '1px solid var(--color-neutral-200)',
                backgroundColor: 'var(--color-neutral-100)',
                color: 'var(--color-neutral-600)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Ingen ja/nei-signaler er tilgjengelige for denne uken ennå.
            </div>
          )}
        </div>
      )}

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
          Skala-spørsmål vises som 1-5-trender. Detaljgrafer lastes først når du
          kommer ned til denne delen.
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
