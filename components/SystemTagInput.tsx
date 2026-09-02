'use client'

import {
  addSystemTag,
  getSystemTagSuggestions,
  removeSystemTag,
} from '@/server/actions/dashboard'
import { useEffect, useState, useTransition } from 'react'

interface SystemTagInputProps {
  itemId: string
  teamId: string
  existingTags: string[]
  onUpdate?: () => void
}

export function SystemTagInput({
  itemId,
  teamId,
  existingTags,
  onUpdate,
}: SystemTagInputProps) {
  const [input, setInput] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [_isPending, startTransition] = useTransition()

  // Load every known tag for the team up front, so people can see and
  // pick from the full list instead of typing blind.
  useEffect(() => {
    void getSystemTagSuggestions(teamId).then(({ suggestions, error }) => {
      if (error) {
        setError(error)
        return
      }
      setAllTags(suggestions)
    })
  }, [teamId])

  const availableTags = allTags
    .filter((s) => !existingTags.includes(s))
    .filter((s) => s.toLowerCase().includes(input.toLowerCase()))

  const handleAddTag = async (tag: string) => {
    if (!tag.trim() || existingTags.length >= 5) return

    startTransition(async () => {
      try {
        const result = await addSystemTag(itemId, tag)
        if (result.error) {
          setError(result.error)
          return
        }
        setError(null)
        setInput('')
        setAllTags((prev) =>
          prev.includes(tag.trim().toLowerCase())
            ? prev
            : [...prev, tag.trim().toLowerCase()]
        )
        // Notify parent to refresh - don't use router.refresh() to avoid conflicts with revalidatePath
        onUpdate?.()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Ukjent feil'
        console.error('Add tag error:', msg, err)
        setError(msg)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      void handleAddTag(input)
    }
  }

  const handleRemoveTag = async (tag: string) => {
    startTransition(async () => {
      try {
        const result = await removeSystemTag(itemId, tag)
        if (result.error) {
          setError(result.error)
          return
        }
        setError(null)
        // Notify parent to refresh - don't use router.refresh() to avoid conflicts with revalidatePath
        onUpdate?.()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Ukjent feil'
        console.error('Remove tag error:', msg, err)
        setError(msg)
      }
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-xs)',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--color-error, #ef4444)',
            padding: 'var(--space-xs) var(--space-sm)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            width: '100%',
          }}
        >
          ❌ {error}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-xs)',
          alignItems: 'center',
        }}
      >
        {existingTags.map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: 'var(--space-xs) var(--space-sm)',
              backgroundColor: 'var(--color-neutral-200, #e5e5e5)',
              color: 'var(--color-neutral-700, #404040)',
              borderRadius: 'var(--radius-md, 0.375rem)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              fontWeight: 500,
            }}
          >
            🏷️ {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                marginLeft: 'var(--space-xs)',
                color: 'inherit',
                opacity: 0.6,
                fontSize: '0.875rem',
              }}
              title="Fjern tag"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {existingTags.length < 5 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-xs)',
            width: '100%',
          }}
        >
          {availableTags.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-xs)',
              }}
            >
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  style={{
                    padding: '2px 10px',
                    borderRadius: '999px',
                    border: '1px solid var(--color-neutral-300)',
                    background: 'var(--color-neutral-50)',
                    color: 'var(--color-primary-dark)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-mist)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-neutral-50)'
                  }}
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ny tag..."
            style={{
              padding: 'var(--space-xs) var(--space-sm)',
              border: '1px solid var(--color-neutral-300, #d4d4d4)',
              borderRadius: 'var(--radius-md, 0.375rem)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              width: '140px',
            }}
          />
        </div>
      )}
    </div>
  )
}
