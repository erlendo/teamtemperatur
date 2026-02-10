'use client'

import { useState } from 'react'
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

export function YearStatsView({ data }: { data: WeekData[] }) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const weeksWithResponses = data.filter(
    (week) =>
      week.response_count > 0 &&
      week.question_stats &&
      week.question_stats.length > 0 &&
      week.overall_avg > 0
  )

  const selectableWeeks =
    weeksWithResponses.length > 0 ? weeksWithResponses : data
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(
    Math.max(selectableWeeks.length - 1, 0)
  )

  const selectedWeek =
    selectableWeeks.length > 0 ? selectableWeeks[selectedWeekIndex] : null
  const previousWeek =
    selectedWeekIndex > 0 ? selectableWeeks[selectedWeekIndex - 1] : null

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
    <div>
      {/* Week Selector */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {selectableWeeks.map((week, idx) => (
            <button
              key={week.week}
              onClick={() => setSelectedWeekIndex(idx)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor:
                  idx === selectedWeekIndex ? '#3b82f6' : '#e5e7eb',
                color: idx === selectedWeekIndex ? '#fff' : '#000',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: idx === selectedWeekIndex ? '600' : '400',
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
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: 12,
            marginBottom: '2rem',
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Inneværende uke
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              Uke {selectedWeek.week}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Teamhelse (Bayesiansk)
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {selectedWeek.bayesian_adjusted.toFixed(2)}
              {delta && (
                <span
                  style={{
                    fontSize: '1rem',
                    marginLeft: '0.5rem',
                    color: Number(delta) >= 0 ? '#059669' : '#dc2626',
                  }}
                >
                  {Number(delta) >= 0 ? '↑' : '↓'} {Math.abs(Number(delta))}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Råscore: {selectedWeek.overall_avg.toFixed(2)} · Glidende:{' '}
              {selectedWeek.moving_average.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Svarprosent
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {selectedWeek.response_rate.toFixed(0)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              {selectedWeek.response_count} av {selectedWeek.member_count}{' '}
              medlemmer
            </div>
          </div>
        </div>
      )}

      {/* Main Year Chart */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Årsoversikt (52 uker)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="bayesiansk"
              name="Bayesiansk justert"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="glidende"
              name="Glidende gjennomsnitt"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="svarprosent"
              name="Svarprosent"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Question Cards Grid */}
      <div>
        <h2 style={{ marginBottom: '1rem' }}>Spørsmål</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {questions.map((q) => {
            const trend = getQuestionTrend(q.question_key)
            const qDelta = getQuestionDelta(q.question_key)
            const isExpanded = expandedQuestion === q.question_key

            return (
              <div key={q.question_key}>
                <button
                  onClick={() =>
                    setExpandedQuestion(isExpanded ? null : q.question_key)
                  }
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
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
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {q.avg_score.toFixed(2)}
                      {qDelta && (
                        <span
                          style={{
                            fontSize: '0.875rem',
                            marginLeft: '0.5rem',
                            color: Number(qDelta) >= 0 ? '#059669' : '#dc2626',
                          }}
                        >
                          {Number(qDelta) >= 0 ? '↑' : '↓'}{' '}
                          {Math.abs(Number(qDelta))}
                        </span>
                      )}
                    </div>
                    {/* Sparkline */}
                    <div style={{ width: 80, height: 40 }}>
                      <ResponsiveContainer>
                        <AreaChart data={trend}>
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#2563eb"
                            fill="#3b82f6"
                            fillOpacity={0.3}
                            strokeWidth={2}
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {q.count} svar · Klikk for detaljer
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="week" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="score"
                          name={q.question_label}
                          fill="#3b82f6"
                          stroke="#2563eb"
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
