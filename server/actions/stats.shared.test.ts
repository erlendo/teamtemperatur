import { describe, expect, it, vi } from 'vitest'

import {
  normalizeYearStatsRows,
  statsTestables,
} from '@/server/actions/stats.shared'

describe('normalizeYearStatsRows', () => {
  it('parses question stats from JSON strings', () => {
    const result = normalizeYearStatsRows([
      {
        week: 11,
        overall_avg: 4.1,
        bayesian_adjusted: 3.9,
        moving_average: 3.8,
        response_count: 6,
        member_count: 8,
        response_rate: 0.75,
        question_stats:
          '[{"question_key":"q1","question_label":"Trivsel","sort_order":1,"avg_score":4.3,"count":6}]',
      },
    ])

    expect(result).toEqual([
      {
        week: 11,
        overall_avg: 4.1,
        bayesian_adjusted: 3.9,
        moving_average: 3.8,
        response_count: 6,
        member_count: 8,
        response_rate: 0.75,
        question_stats: [
          {
            question_key: 'q1',
            question_label: 'Trivsel',
            sort_order: 1,
            avg_score: 4.3,
            count: 6,
          },
        ],
      },
    ])
  })

  it('keeps question stats arrays unchanged', () => {
    const questionStats = [
      {
        question_key: 'q2',
        question_label: 'Samarbeid',
        sort_order: 2,
        avg_score: 3.7,
        count: 5,
      },
    ]

    const result = normalizeYearStatsRows([
      {
        week: 12,
        overall_avg: 3.7,
        bayesian_adjusted: 3.5,
        moving_average: 3.6,
        response_count: 5,
        member_count: 7,
        response_rate: 0.71,
        question_stats: questionStats,
      },
    ])

    expect(result[0]?.question_stats).toEqual(questionStats)
  })
})

describe('parseQuestionStats', () => {
  it('returns an empty array for invalid JSON and reports the parse error', () => {
    const onParseError = vi.fn()

    const result = statsTestables.parseQuestionStats(
      '{invalid json',
      onParseError
    )

    expect(result).toEqual([])
    expect(onParseError).toHaveBeenCalledTimes(1)
  })

  it('returns an empty array for non-array payloads', () => {
    expect(
      statsTestables.parseQuestionStats({
        question_key: 'q1',
      })
    ).toEqual([])
  })
})
