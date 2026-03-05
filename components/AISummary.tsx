'use client'

import { regenerateWeeklySummary } from '@/server/actions/ai'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'

interface AISummaryProps {
  summary: string
  teamId?: string
  isTeamAdmin?: boolean
  year?: number
  weekNumber?: number
  summaryData?: {
    overallAvg: number
    bayesianAdjusted: number
    responseRate: number
    responseCount: number
    memberCount: number
    topQuestionLabel?: string
    topQuestionScore?: number
    bottomQuestionLabel?: string
    bottomQuestionScore?: number
  }
}

export function AISummary({
  summary,
  teamId,
  isTeamAdmin,
  year,
  weekNumber,
  summaryData,
}: AISummaryProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegenerate = async () => {
    if (!teamId || !year || !weekNumber || !summaryData) return

    setIsRegenerating(true)
    setError(null)

    try {
      const result = await regenerateWeeklySummary(
        teamId,
        year,
        weekNumber,
        summaryData
      )

      if (!result.success) {
        setError(result.error || 'Kunne ikke regenerere sammendrag')
      } else {
        // Reload siden
        window.location.reload()
      }
    } catch (err) {
      setError('En feil oppstod under regenerering')
      console.error('Regenerate error:', err)
    } finally {
      setIsRegenerating(false)
    }
  }

  if (!summary) {
    return null
  }

  return (
    <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          <div className="flex-shrink-0">
            <Sparkles className="h-5 w-5 text-purple-600" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="text-sm font-medium text-purple-800">
              Ukentlig innsikt (AI-generert)
            </h3>
            <div className="mt-2 text-sm text-purple-700">
              <p className="break-words">{summary}</p>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
        {isTeamAdmin && (
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="ml-4 flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Regenerer AI-sammendrag"
          >
            {isRegenerating ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                Generer...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Regenerer
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
