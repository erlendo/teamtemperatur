'use client'

import { useVisibleRelations } from '@/hooks/useVisibleRelations'
import { Eye, EyeOff } from 'lucide-react'

export function RelationToggle() {
  const { showRelations, toggleRelations, mounted } = useVisibleRelations()

  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={toggleRelations}
      style={{
        position: 'fixed',
        bottom: 'var(--space-xl)',
        right: 'calc(var(--space-xl) + 80px)',
        padding: 'var(--space-md)',
        backgroundColor: showRelations
          ? 'var(--color-primary, #3b82f6)'
          : 'var(--color-neutral-300)',
        color: showRelations ? 'white' : 'var(--color-neutral-700)',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
      title={showRelations ? 'Skjul piler' : 'Vis piler'}
    >
      {showRelations ? <Eye size={24} /> : <EyeOff size={24} />}
    </button>
  )
}
