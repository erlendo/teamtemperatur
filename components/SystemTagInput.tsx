'use client'

import {
  addSystemTag,
  getSystemTagSuggestions,
  removeSystemTag,
} from '@/server/actions/dashboard'
import { useEffect, useRef, useState, useTransition } from 'react'

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
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [_isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (input.length > 0) {
      void getSystemTagSuggestions(teamId).then(({ suggestions, error }) => {
        if (error) {
          setError(error)
          return
        }
        const filtered = suggestions.filter(
          (s) =>
            s.toLowerCase().includes(input.toLowerCase()) &&
            !existingTags.includes(s)
        )
        setSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
      })
    } else {
      setShowSuggestions(false)
    }
  }, [input, teamId, existingTags])

  const handleAddTag = async (tag: string) => {
    if (!tag.trim() || existingTags.length >= 5) return

    startTransition(async () => {
      try {
        console.log('Adding tag:', tag, 'to item:', itemId)
        const result = await addSystemTag(itemId, tag)
        if (result.error) {
          console.error('Server error:', result.error)
          setError(result.error)
          return
        }
        console.log('Tag added successfully')
        setError(null)
        setInput('')
        setShowSuggestions(false)
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
        console.log('Removing tag:', tag, 'from item:', itemId)
        const result = await removeSystemTag(itemId, tag)
        if (result.error) {
          console.error('Server error:', result.error)
          setError(result.error)
          return
        }
        console.log('Tag removed successfully')
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

        {existingTags.length < 5 && (
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Legg til tag..."
              style={{
                padding: 'var(--space-xs) var(--space-sm)',
                border: '1px solid var(--color-neutral-300, #d4d4d4)',
                borderRadius: 'var(--radius-md, 0.375rem)',
                fontSize: 'var(--font-size-xs, 0.75rem)',
                width: '120px',
              }}
            />
            {showSuggestions && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 'var(--space-xs)',
                  backgroundColor: 'white',
                  border: '1px solid var(--color-neutral-300)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 10,
                  maxHeight: '150px',
                  overflowY: 'auto',
                  minWidth: '150px',
                }}
              >
                {suggestions.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddTag(suggestion)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 'var(--space-sm)',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'var(--color-neutral-100, #f5f5f5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
