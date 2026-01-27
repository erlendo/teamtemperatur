'use client'

import { createTeam } from '@/server/actions/teams'
import { Thermometer, Users, Plus, LogOut, Crown, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

interface TeamsListProps {
  teams: Array<{ id: string; name: string; role: string }>
}

export function TeamsList({ teams }: TeamsListProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCreateTeam(formData: FormData) {
    const name = String(formData.get('name') || '').trim()
    if (!name) return

    setError(null)

    startTransition(async () => {
      const result = await createTeam(name)

      if ('error' in result) {
        setError(result.error || 'Ukjent feil')
      } else {
        setError(null)
        ;(
          document.querySelector('input[name="name"]') as HTMLInputElement
        ).value = ''
      }
    })
  }

  return (
    <div
      style={{ minHeight: '100vh', backgroundColor: 'var(--color-neutral-50)' }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--color-neutral-200)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: 'var(--space-lg) var(--space-md)',
          }}
        >
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
        </div>
      </header>

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'var(--space-3xl) var(--space-md)',
        }}
      >
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Users size={28} />
            Mine Team
          </h1>
          <p
            style={{
              color: 'var(--color-neutral-600)',
              marginBottom: 'var(--space-2xl)',
            }}
          >
            {teams.length === 0
              ? 'Du er ikke medlem av noen team ennå. Opprett et nytt team for å komme i gang!'
              : `Du er medlem av ${teams.length} team${teams.length !== 1 ? '' : ''}.`}
          </p>

          {/* Create Team Form */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--color-neutral-200)',
              padding: 'var(--space-xl)',
              marginBottom: 'var(--space-2xl)',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--font-size-lg)',
                marginBottom: 'var(--space-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
              }}
            >
              <Plus size={20} />
              Opprett Nytt Team
            </h2>
            <form
              action={handleCreateTeam}
              style={{ display: 'grid', gap: 'var(--space-md)' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: 'var(--space-sm)',
                    color: 'var(--color-neutral-700)',
                  }}
                >
                  Teamnavn
                </label>
                <input
                  name="name"
                  placeholder="f.eks. «Produktteam»"
                  style={{ width: '100%' }}
                  disabled={isPending}
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  padding: 'var(--space-md) var(--space-xl)',
                  backgroundColor: isPending
                    ? 'var(--color-neutral-300)'
                    : 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md)',
                  fontWeight: '700',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  alignSelf: 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!isPending) {
                    ;(
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = 'var(--color-primary-dark)'
                    ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                      'var(--shadow-lg)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPending) {
                    ;(
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = 'var(--color-primary)'
                    ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                      'none'
                  }
                }}
              >
                {isPending ? '⏳ Opprettet...' : '✨ Opprett Team'}
              </button>
            </form>
          </div>

          {error && (
            <div
              className="alert alert-error"
              style={{ marginBottom: 'var(--space-lg)' }}
            >
              {error}
            </div>
          )}

          {/* Teams List */}
          {teams.length > 0 && (
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-lg)',
                  marginBottom: 'var(--space-md)',
                }}
              >
                Dine Team
              </h2>
              {teams.map((t) => (
                <Link
                  key={t.id}
                  href={`/t/${t.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-lg)',
                    backgroundColor: 'white',
                    border: '1px solid var(--color-neutral-200)',
                    borderRadius: 'var(--border-radius-lg)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      'var(--shadow-md)'
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
                      'var(--color-primary-light)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      'none'
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
                      'var(--color-neutral-200)'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: 'var(--font-size-lg)',
                        color: 'var(--color-neutral-900)',
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-neutral-600)',
                        marginTop: 'var(--space-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-xs)',
                      }}
                    >
                      {t.role === 'owner' && (
                        <>
                          <Crown size={14} />
                          Eier
                        </>
                      )}
                      {t.role === 'admin' && (
                        <>
                          <Settings size={14} />
                          Admin
                        </>
                      )}
                      {t.role === 'member' && (
                        <>
                          <User size={14} />
                          Medlem
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xl)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Logout */}
          <form
            action="/logout"
            method="post"
            style={{ marginTop: 'var(--space-3xl)' }}
          >
            <button
              type="submit"
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'transparent',
                color: 'var(--color-neutral-600)',
                border: '1px solid var(--color-neutral-300)',
                borderRadius: 'var(--border-radius-md)',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                  'var(--color-error)'
                ;(e.currentTarget as HTMLButtonElement).style.color =
                  'var(--color-error)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                  'var(--color-neutral-300)'
                ;(e.currentTarget as HTMLButtonElement).style.color =
                  'var(--color-neutral-600)'
              }}
            >
              <LogOut size={16} />
              Logg ut
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
