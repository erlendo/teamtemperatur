'use client'

import {
  addSystemTag,
  getSystemTagSuggestions,
} from '@/server/actions/dashboard'
import type { TertialItem } from '@/server/actions/stats'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

export function UkjentTagRow({
  item,
  teamId,
}: {
  item: TertialItem
  teamId: string
}) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (input.length === 0) {
      setShowSuggestions(false)
      return
    }
    void getSystemTagSuggestions(teamId).then(({ suggestions }) => {
      const filtered = suggestions.filter((s) =>
        s.toLowerCase().includes(input.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    })
  }, [input, teamId])

  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return
    startTransition(async () => {
      const result = await addSystemTag(item.id, tag)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setInput('')
      setShowSuggestions(false)
      router.refresh()
    })
  }

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: '0.2rem 0',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-neutral-800)',
      }}
    >
      <span style={{ flex: 1 }}>
        {item.title}
        <span style={{ color: 'var(--color-neutral-400)' }}> — </span>
        <span style={{ color: 'var(--color-neutral-500)' }}>
          {item.members.length > 0
            ? item.members.join(', ')
            : '(ukjent ansvarlig)'}
        </span>
      </span>
      <span style={{ position: 'relative', flexShrink: 0 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault()
              handleAddTag(input)
            }
          }}
          placeholder="+ tag"
          disabled={isPending}
          style={{
            padding: '0.1rem 0.5rem',
            border: '1px solid var(--color-neutral-300)',
            borderRadius: '999px',
            fontSize: 'var(--font-size-xs)',
            width: '90px',
            opacity: isPending ? 0.6 : 1,
          }}
        />
        {showSuggestions && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              border: '1px solid var(--color-neutral-300)',
              borderRadius: 'var(--border-radius-md)',
              boxShadow: 'var(--shadow-md)',
              zIndex: 10,
              minWidth: '120px',
              maxHeight: '150px',
              overflowY: 'auto',
            }}
          >
            {suggestions.slice(0, 5).map((s) => (
              <button
                key={s}
                onClick={() => handleAddTag(s)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 'var(--space-xs) var(--space-sm)',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </span>
      {error && (
        <span
          style={{
            color: 'var(--color-error, #ef4444)',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          {error}
        </span>
      )}
    </li>
  )
}
