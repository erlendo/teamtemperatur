'use client'

import { BarChart3, LayoutDashboard, PenTool, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'

export function AppHeaderNav({
  teamId,
  isTeamAdmin,
}: {
  teamId: string
  isTeamAdmin?: boolean
}) {
  const pathname = usePathname()
  const baseStyle: CSSProperties = {
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
    border: '1px solid transparent',
  }
  const activeStyle: CSSProperties = {
    color: 'var(--color-primary)',
    backgroundColor: 'var(--color-neutral-100)',
    borderColor: 'var(--color-neutral-200)',
  }

  const getStyle = (isActive: boolean) =>
    isActive ? { ...baseStyle, ...activeStyle } : baseStyle

  return (
    <nav
      style={{
        display: 'flex',
        gap: 'var(--space-lg)',
        marginLeft: 'auto',
      }}
    >
      <Link
        href={`/t/${teamId}`}
        style={getStyle(pathname === `/t/${teamId}`)}
      >
        <LayoutDashboard size={16} />
        Dashboard
      </Link>
      <Link
        href={`/t/${teamId}/survey`}
        style={getStyle(pathname?.startsWith(`/t/${teamId}/survey`) ?? false)}
      >
        <PenTool size={16} />
        Ny måling
      </Link>
      <Link
        href={`/t/${teamId}/stats`}
        style={getStyle(pathname?.startsWith(`/t/${teamId}/stats`) ?? false)}
      >
        <BarChart3 size={16} />
        Statistikk
      </Link>
      {isTeamAdmin && (
        <Link
          href={`/t/${teamId}/admin`}
          style={getStyle(pathname?.startsWith(`/t/${teamId}/admin`) ?? false)}
        >
          <Users size={16} />
          Team Admin
        </Link>
      )}
      <Link
        href="/teams"
        style={getStyle(pathname?.startsWith('/teams') ?? false)}
      >
        <Users size={16} />
        Team
      </Link>
    </nav>
  )
}
