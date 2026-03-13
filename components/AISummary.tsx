'use client'

import type { WeeklySummaryData } from '@/server/actions/ai'
import { regenerateWeeklySummary } from '@/server/actions/ai'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface AISummaryProps {
  summary: string
  teamId?: string
  isTeamOwner?: boolean
  year?: number
  weekNumber?: number
  summaryData?: WeeklySummaryData
}

export function AISummary({
  summary,
  teamId,
  isTeamOwner,
  year,
  weekNumber,
  summaryData,
}: AISummaryProps) {
  const router = useRouter()
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localSummary, setLocalSummary] = useState(summary)

  const hasCompleteResponseSet =
    !!summaryData &&
    summaryData.memberCount > 0 &&
    summaryData.responseCount === summaryData.memberCount

  const canGenerate =
    !!teamId &&
    !!year &&
    !!weekNumber &&
    !!summaryData &&
    hasCompleteResponseSet

  const buttonLabel = localSummary ? 'Generer på nytt' : 'Generer AI-sammendrag'

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
        setError(result.error || 'Kunne ikke generere sammendrag')
      } else {
        if (result.summary) {
          setLocalSummary(result.summary)
        }
        router.refresh()
      }
    } catch (err) {
      setError('En feil oppstod under generering')
      console.error('Regenerate error:', err)
    } finally {
      setIsRegenerating(false)
    }
  }

  if (!localSummary && !isTeamOwner) {
    return null
  }

  return (
    <div
      style={{
        marginBottom: 'var(--space-xl)',
        borderRadius: '1rem',
        border: '1px solid var(--color-neutral-200)',
        background: localSummary
          ? 'linear-gradient(180deg, var(--color-neutral-100), rgba(230, 239, 240, 0.7))'
          : 'var(--color-neutral-100)',
        padding: 'var(--space-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-lg)',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-md)',
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: '2.5rem',
              height: '2.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.875rem',
              backgroundColor: 'var(--color-teal-soft)',
              color: 'var(--color-primary-dark)',
            }}
          >
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                color: 'var(--color-primary-dark)',
              }}
            >
              Ukentlig innsikt (AI-generert)
            </h3>
            <div
              style={{
                marginTop: 'var(--space-sm)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-neutral-700)',
              }}
            >
              {localSummary ? (
                <p style={{ margin: 0, wordBreak: 'break-word' }}>
                  {localSummary}
                </p>
              ) : (
                <p style={{ margin: 0 }}>
                  Ingen AI-oppsummering er generert ennå. Teksten blir lagret og
                  stående uendret til eier velger å generere på nytt.
                </p>
              )}
            </div>
            {!hasCompleteResponseSet && summaryData && (
              <p
                style={{
                  marginTop: 'var(--space-sm)',
                  marginBottom: 0,
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-neutral-600)',
                }}
              >
                AI-sammendrag kan genereres når alle {summaryData.memberCount}{' '}
                deltakere har svart. Nå er {summaryData.responseCount} av{' '}
                {summaryData.memberCount} inne.
              </p>
            )}
            {error && (
              <p
                style={{
                  marginTop: 'var(--space-sm)',
                  marginBottom: 0,
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-error-dark)',
                }}
              >
                {error}
              </p>
            )}
          </div>
        </div>
        {isTeamOwner && (
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || !canGenerate}
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '999px',
              border: '1px solid var(--color-primary)',
              backgroundColor:
                isRegenerating || !canGenerate
                  ? 'var(--color-neutral-100)'
                  : 'var(--color-primary)',
              color:
                isRegenerating || !canGenerate
                  ? 'var(--color-neutral-500)'
                  : 'white',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              cursor:
                isRegenerating || !canGenerate ? 'not-allowed' : 'pointer',
              opacity: isRegenerating || !canGenerate ? 0.7 : 1,
            }}
            title="Generer AI-sammendrag"
          >
            <Sparkles size={14} />
            {isRegenerating ? 'Genererer...' : buttonLabel}
          </button>
        )}
      </div>
    </div>
  )
}
