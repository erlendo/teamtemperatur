import { BarChart3, PenTool, Thermometer, Users } from 'lucide-react'
import Link from 'next/link'

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

            {teamId && (
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
                    ;(
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = 'var(--color-neutral-100)'
                    ;(e.currentTarget as HTMLAnchorElement).style.color =
                      'var(--color-primary)'
                  }}
                  onMouseLeave={(e) => {
                    ;(
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = 'transparent'
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
                    ;(
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = 'var(--color-neutral-100)'
                    ;(e.currentTarget as HTMLAnchorElement).style.color =
                      'var(--color-primary)'
                  }}
                  onMouseLeave={(e) => {
                    ;(
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = 'transparent'
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
                    ;(
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = 'var(--color-neutral-100)'
                    ;(e.currentTarget as HTMLAnchorElement).style.color =
                      'var(--color-primary)'
                  }}
                  onMouseLeave={(e) => {
                    ;(
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = 'transparent'
                    ;(e.currentTarget as HTMLAnchorElement).style.color =
                      'var(--color-neutral-600)'
                  }}
                >
                  <Users size={16} />
                  Team
                </Link>
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
