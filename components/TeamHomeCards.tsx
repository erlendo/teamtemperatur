'use client'

import { BarChart3, PenTool } from 'lucide-react'
import Link from 'next/link'

export function TeamHomeCards({ teamId }: { teamId: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-2xl)',
      }}
    >
      {/* Survey Card */}
      <Link
        href={`/t/${teamId}/survey`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-xl)',
          backgroundColor: 'white',
          border: '2px solid var(--color-neutral-200)',
          borderRadius: 'var(--border-radius-lg)',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
            'var(--shadow-lg)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
            'var(--color-primary)'
          ;(e.currentTarget as HTMLAnchorElement).style.transform =
            'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
            'var(--color-neutral-200)'
          ;(e.currentTarget as HTMLAnchorElement).style.transform =
            'translateY(0)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            backgroundColor: 'var(--color-primary-light)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: 'var(--space-lg)',
            color: 'var(--color-primary)',
          }}
        >
          <PenTool size={28} />
        </div>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          Ny måling
        </h2>
        <p
          style={{
            color: 'var(--color-neutral-600)',
            flex: 1,
            marginBottom: 'var(--space-md)',
          }}
        >
          Fyll ut ukentlig spørreundersøkelse for å måle teamhelse
        </p>
        <div style={{ color: 'var(--color-primary)', fontWeight: '700' }}>
          Start måling →
        </div>
      </Link>

      {/* Stats Card */}
      <Link
        href={`/t/${teamId}/stats`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-xl)',
          backgroundColor: 'white',
          border: '2px solid var(--color-neutral-200)',
          borderRadius: 'var(--border-radius-lg)',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
            'var(--shadow-lg)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
            'var(--color-secondary)'
          ;(e.currentTarget as HTMLAnchorElement).style.transform =
            'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
            'var(--color-neutral-200)'
          ;(e.currentTarget as HTMLAnchorElement).style.transform =
            'translateY(0)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            backgroundColor: 'var(--color-secondary-light)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: 'var(--space-lg)',
            color: 'var(--color-secondary)',
          }}
        >
          <BarChart3 size={28} />
        </div>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          Statistikk
        </h2>
        <p
          style={{
            color: 'var(--color-neutral-600)',
            flex: 1,
            marginBottom: 'var(--space-md)',
          }}
        >
          Se trends, gjennomsnitt og respons over tid
        </p>
        <div style={{ color: 'var(--color-secondary)', fontWeight: '700' }}>
          Vis statistikk →
        </div>
      </Link>
    </div>
  )
}
