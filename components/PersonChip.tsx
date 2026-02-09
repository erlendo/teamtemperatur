'use client'

import { removeMemberTag } from '@/server/actions/dashboard'

interface PersonChipProps {
  userId: string
  displayName: string
  itemId: string
  onUpdate?: () => void
}

export function PersonChip({
  userId,
  displayName,
  itemId,
  onUpdate,
}: PersonChipProps) {

  const handleRemove = async () => {
    await removeMemberTag(itemId, userId)
    onUpdate?.()
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        padding: 'var(--space-xs) var(--space-sm)',
        backgroundColor: 'var(--color-primary-light, #e0f2fe)',
        color: 'var(--color-primary-dark, #0c4a6e)',
        borderRadius: 'var(--radius-full, 9999px)',
        fontSize: 'var(--font-size-sm, 0.875rem)',
        fontWeight: 500,
      }}
    >
      👤 {displayName}
      <button
        onClick={handleRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginLeft: 'var(--space-xs)',
          color: 'inherit',
          opacity: 0.6,
          fontSize: '1rem',
        }}
        title="Fjern"
      >
        ×
      </button>
    </span>
  )
}
