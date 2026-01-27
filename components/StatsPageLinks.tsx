'use client'

import { PenTool } from 'lucide-react'

export function NewMeasurementButton({ teamId }: { teamId: string }) {
  return (
    <a
      href={`/t/${teamId}/survey`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: 'var(--space-md) var(--space-xl)',
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        textDecoration: 'none',
        borderRadius: 'var(--border-radius-md)',
        fontWeight: '700',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
          'var(--color-primary-dark)'
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
          'var(--shadow-lg)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
          'var(--color-primary)'
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
      }}
    >
      <PenTool size={18} />
      Gå til ny måling
    </a>
  )
}

export function BackToTeamLink({ teamId }: { teamId: string }) {
  return (
    <a
      href={`/t/${teamId}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        color: 'var(--color-primary)',
        fontWeight: '500',
        textDecoration: 'none',
        padding: 'var(--space-sm) var(--space-md)',
        borderRadius: 'var(--border-radius-md)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
          'var(--color-neutral-100)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
          'transparent'
      }}
    >
      ← Tilbake til team
    </a>
  )
}
