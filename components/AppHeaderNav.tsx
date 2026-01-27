'use client'

import { BarChart3, PenTool, Users } from 'lucide-react'
import Link from 'next/link'

export function AppHeaderNav({ teamId }: { teamId: string }) {
  return (
    <nav
      style={{
        display: 'flex',
        gap: 'var(--space-lg)',
        marginLeft: 'auto',
      }}
    >
      <Link
        href={`/t/${teamId}/survey`}
        style={{
          color: 'var(--color-neutral-600)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: '500',
          padding: 'var(--space-sm) var(--space-md)',
          borderRadius: 'var(--border-radius-md)',
          transition: 'all 0.2s ease',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'var(--color-neutral-100)'
          ;(e.currentTarget as HTMLAnchorElement).style.color =
            'var(--color-primary)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'transparent'
          ;(e.currentTarget as HTMLAnchorElement).style.color =
            'var(--color-neutral-600)'
        }}
      >
        <PenTool size={16} />
        Ny måling
      </Link>
      <Link
        href={`/t/${teamId}/stats`}
        style={{
          color: 'var(--color-neutral-600)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: '500',
          padding: 'var(--space-sm) var(--space-md)',
          borderRadius: 'var(--border-radius-md)',
          transition: 'all 0.2s ease',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'var(--color-neutral-100)'
          ;(e.currentTarget as HTMLAnchorElement).style.color =
            'var(--color-primary)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'transparent'
          ;(e.currentTarget as HTMLAnchorElement).style.color =
            'var(--color-neutral-600)'
        }}
      >
        <BarChart3 size={16} />
        Statistikk
      </Link>
      <Link
        href="/teams"
        style={{
          color: 'var(--color-neutral-600)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: '500',
          padding: 'var(--space-sm) var(--space-md)',
          borderRadius: 'var(--border-radius-md)',
          transition: 'all 0.2s ease',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'var(--color-neutral-100)'
          ;(e.currentTarget as HTMLAnchorElement).style.color =
            'var(--color-primary)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'transparent'
          ;(e.currentTarget as HTMLAnchorElement).style.color =
            'var(--color-neutral-600)'
        }}
      >
        <Users size={16} />
        Team
      </Link>
    </nav>
  )
}
