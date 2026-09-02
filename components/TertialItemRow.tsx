'use client'

import {
  addSystemTag,
  getSystemTagSuggestions,
  removeSystemTag,
} from '@/server/actions/dashboard'
import type { TertialItem } from '@/server/actions/stats'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

export function TertialItemRow({
  item,
  teamId,
}: {
  item: TertialItem
  teamId: string
}) {
  const [input, setInput] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Load every known tag for the team up front, so people can see and
  // pick from the full list instead of typing blind.
  useEffect(() => {
    void getSystemTagSuggestions(teamId).then(({ suggestions }) => {
      setAllTags(suggestions)
    })
  }, [teamId])

  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return
    startTransition(async () => {
      const result = await addSystemTag(item.id, tag, teamId)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setInput('')
      router.refresh()
    })
  }

  const handleRemoveTag = (tag: string) => {
    startTransition(async () => {
      const result = await removeSystemTag(item.id, tag, teamId)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      router.refresh()
    })
  }

  const availableTags = allTags.filter((t) => !item.tags.includes(t))

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-sm)',
        padding: '0.3rem 0',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-neutral-800)',
      }}
    >
      <span style={{ flex: '1 1 auto', minWidth: '12rem' }}>
        {item.title}
        <span style={{ color: 'var(--color-neutral-400)' }}> — </span>
        <span style={{ color: 'var(--color-neutral-500)' }}>
          {item.members.length > 0
            ? item.members.join(', ')
            : '(ukjent ansvarlig)'}
        </span>
      </span>

      <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {item.tags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleRemoveTag(tag)}
            disabled={isPending}
            title="Fjern tag"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '1px 8px',
              borderRadius: '999px',
              border: '1px solid var(--color-neutral-300)',
              background: 'var(--color-mist)',
              color: 'var(--color-primary-dark)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {tag}
            <span style={{ opacity: 0.6 }}>×</span>
          </button>
        ))}
        {availableTags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleAddTag(tag)}
            disabled={isPending}
            style={{
              padding: '1px 8px',
              borderRadius: '999px',
              border: '1px solid var(--color-neutral-300)',
              background: 'var(--color-neutral-50)',
              color: 'var(--color-primary-dark)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
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
          placeholder="ny tag"
          disabled={isPending}
          style={{
            padding: '0.1rem 0.5rem',
            border: '1px solid var(--color-neutral-300)',
            borderRadius: '999px',
            fontSize: 'var(--font-size-xs)',
            width: '80px',
            opacity: isPending ? 0.6 : 1,
          }}
        />
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
