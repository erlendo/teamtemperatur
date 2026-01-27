import { Thermometer } from 'lucide-react'
import Link from 'next/link'
import { AppHeaderNav } from './AppHeaderNav'

export function AppHeader({
  teamId,
  teamName,
}: {
  teamId?: string
  teamName?: string
}) {
  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--color-neutral-200)',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'var(--space-lg) var(--space-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-lg)',
          }}
        >
          {/* Logo */}
          <Link
            href="/teams"
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: '700',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}
          >
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--border-radius-md)',
                background:
                  'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
              }}
            >
              <Thermometer size={18} />
            </span>
            Teamtemperatur
          </Link>

          {/* Team Name + Nav */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xl)',
              flex: 1,
            }}
          >
            {teamName && (
              <div
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '600',
                  color: 'var(--color-neutral-700)',
                  paddingLeft: 'var(--space-lg)',
                  borderLeft: '2px solid var(--color-neutral-200)',
                }}
              >
                {teamName}
              </div>
            )}

            {teamId && <AppHeaderNav teamId={teamId} />}
          </div>
        </div>
      </div>
    </header>
  )
}
