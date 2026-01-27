'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from 'recharts'
import { useState } from 'react'

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
  response_count: number
  member_count: number
  response_rate: number
  question_stats: QuestionStat[]
}

export function YearStatsView({ data }: { data: WeekData[] }) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const currentWeek = data.length > 0 ? data[data.length - 1] : null
  const previousWeek = data.length > 1 ? data[data.length - 2] : null

  const delta =
    currentWeek && previousWeek
      ? (currentWeek.overall_avg - previousWeek.overall_avg).toFixed(2)
      : null

  // Transform data for main chart
  const chartData = data.map((w) => ({
    week: w.week,
    helse: Number(w.overall_avg.toFixed(2)),
    svarprosent: Number(w.response_rate.toFixed(1)),
  }))

  // Get unique questions from current week
  const questions =
    currentWeek?.question_stats?.sort((a, b) => a.sort_order - b.sort_order) ||
    []

  // Get question trend data (last 12 weeks) for each question
  const getQuestionTrend = (questionKey: string) => {
    const last12 = data.slice(-12)
    return last12.map((w) => {
      const qStat = w.question_stats?.find((q) => q.question_key === questionKey)
      return {
        week: w.week,
        score: qStat ? Number(qStat.avg_score.toFixed(2)) : null,
      }
    })
  }

  const getQuestionDelta = (questionKey: string) => {
    if (!currentWeek || !previousWeek) return null
    const curr = currentWeek.question_stats?.find(
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
      {/* Current Week Summary */}
      {currentWeek && (
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
              Uke {currentWeek.week}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Teamhelse
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {currentWeek.overall_avg.toFixed(2)}
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
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Svarprosent
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {currentWeek.response_rate.toFixed(0)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              {currentWeek.response_count} av {currentWeek.member_count} medlemmer
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
              label={{ value: 'Helse (1-5)', angle: -90, position: 'insideLeft' }}
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
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="helse"
              name="Teamhelse"
              fill="#3b82f6"
              stroke="#2563eb"
              fillOpacity={0.6}
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
                    setExpandedQuestion(
                      isExpanded ? null : q.question_key
                    )
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
                            color:
                              Number(qDelta) >= 0 ? '#059669' : '#dc2626',
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
                            score: qStat ? Number(qStat.avg_score.toFixed(2)) : null,
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
