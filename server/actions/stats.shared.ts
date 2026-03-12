export type WeekStatRow = {
  question_key: string
  question_label: string
  sort_order: number
  avg_score: number
  n_answers: number
}

export type QuestionStat = {
  question_key: string
  question_label: string
  sort_order: number
  avg_score: number
  count: number
}

export type WeekStat = {
  week: number
  overall_avg: number
  bayesian_adjusted: number
  moving_average: number
  response_count: number
  member_count: number
  response_rate: number
  question_stats: QuestionStat[]
}

function parseQuestionStats(
  value: unknown,
  onParseError?: (error: unknown) => void
): QuestionStat[] {
  if (!value) return []

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) ? (parsed as QuestionStat[]) : []
  } catch (error) {
    onParseError?.(error)
    return []
  }
}

export function normalizeYearStatsRows(rows: unknown[]): WeekStat[] {
  return rows.map((week) => {
    const row = week as Record<string, unknown>

    return {
      week: row.week as number,
      overall_avg: row.overall_avg as number,
      bayesian_adjusted: row.bayesian_adjusted as number,
      moving_average: row.moving_average as number,
      response_count: row.response_count as number,
      member_count: row.member_count as number,
      response_rate: row.response_rate as number,
      question_stats: parseQuestionStats(row.question_stats),
    }
  })
}

export const statsTestables = {
  parseQuestionStats,
}
