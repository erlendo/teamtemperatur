'use client'

import { BarChart3, PenTool } from 'lucide-react'
import Link from 'next/link'

export function TeamHomeCards({ teamId }: { teamId: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'var(--space-2xl)',
        marginBottom: 'var(--space-3xl)',
      }}
    >
      {/* Survey Card */}
      <Link
        href={`/t/${teamId}/survey`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-2xl)',
          backgroundColor: 'white',
          border: '2px solid var(--color-primary)',
          borderRadius: 'var(--border-radius-lg)',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
            '0 20px 25px -5px rgba(37, 99, 235, 0.15), 0 10px 10px -5px rgba(37, 99, 235, 0.08)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
            'var(--color-primary-dark)'
          ;(e.currentTarget as HTMLAnchorElement).style.transform =
            'translateY(-4px)'
          const icon = e.currentTarget.querySelector(
            '.survey-icon'
          ) as HTMLElement
          if (icon) {
            icon.style.backgroundColor = 'var(--color-primary-dark)'
            icon.style.transform = 'scale(1.1)'
          }
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
            'var(--shadow-md)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
            'var(--color-primary)'
          ;(e.currentTarget as HTMLAnchorElement).style.transform =
            'translateY(0)'
          const icon = e.currentTarget.querySelector(
            '.survey-icon'
          ) as HTMLElement
          if (icon) {
            icon.style.backgroundColor = 'var(--color-primary)'
            icon.style.transform = 'scale(1)'
          }
        }}
      >
        <div
          className="survey-icon"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            backgroundColor: 'var(--color-primary)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: 'var(--space-xl)',
            color: 'white',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <PenTool size={32} strokeWidth={2} />
        </div>
        <h2
          style={{
            fontSize: 'var(--font-size-2xl)',
            marginBottom: 'var(--space-md)',
            fontWeight: '700',
            color: 'var(--color-neutral-900)',
          }}
        >
          Ny måling
        </h2>
        <p
          style={{
            color: 'var(--color-neutral-600)',
            flex: 1,
            marginBottom: 'var(--space-xl)',
            fontSize: 'var(--font-size-base)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          Fyll ut ukentlig spørreundersøkelse for å måle teamhelse
        </p>
        <div
          style={{
            color: 'var(--color-primary)',
            fontWeight: '700',
            fontSize: 'var(--font-size-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          Start måling →
        </div>
      </Link>

      {/* Stats Card */}
      <Link
        href={`/t/${teamId}/stats`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-2xl)',
          backgroundColor: 'white',
          border: '2px solid var(--color-secondary)',
          borderRadius: 'var(--border-radius-lg)',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
            '0 20px 25px -5px rgba(16, 185, 129, 0.15), 0 10px 10px -5px rgba(16, 185, 129, 0.08)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
            'var(--color-secondary-dark)'
          ;(e.currentTarget as HTMLAnchorElement).style.transform =
            'translateY(-4px)'
          const icon = e.currentTarget.querySelector(
            '.stats-icon'
          ) as HTMLElement
          if (icon) {
            icon.style.backgroundColor = 'var(--color-secondary-dark)'
            icon.style.transform = 'scale(1.1)'
          }
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
            'var(--shadow-md)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
            'var(--color-secondary)'
          ;(e.currentTarget as HTMLAnchorElement).style.transform =
            'translateY(0)'
          const icon = e.currentTarget.querySelector(
            '.stats-icon'
          ) as HTMLElement
          if (icon) {
            icon.style.backgroundColor = 'var(--color-secondary)'
            icon.style.transform = 'scale(1)'
          }
        }}
      >
        <div
          className="stats-icon"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            backgroundColor: 'var(--color-secondary)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: 'var(--space-xl)',
            color: 'white',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <BarChart3 size={32} strokeWidth={2} />
        </div>
        <h2
          style={{
            fontSize: 'var(--font-size-2xl)',
            marginBottom: 'var(--space-md)',
            fontWeight: '700',
            color: 'var(--color-neutral-900)',
          }}
        >
          Statistikk
        </h2>
        <p
          style={{
            color: 'var(--color-neutral-600)',
            flex: 1,
            marginBottom: 'var(--space-xl)',
            fontSize: 'var(--font-size-base)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          Se trends, gjennomsnitt og respons over tid
        </p>
        <div
          style={{
            color: 'var(--color-secondary)',
            fontWeight: '700',
            fontSize: 'var(--font-size-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          Vis statistikk →
        </div>
      </Link>
    </div>
  )
}
