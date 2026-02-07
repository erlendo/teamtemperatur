'use client'

import { createTeam, joinTeam, removeMember } from '@/server/actions/teams'
import {
  Crown,
  LogOut,
  Plus,
  Settings,
  Thermometer,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

interface TeamsListProps {
  myTeams: Array<{
    id: string
    name: string
    role: string
    memberCount?: number
    members?: Array<{ user_id: string; role: string; email: string }>
  }>
  availableTeams: Array<{ id: string; name: string }>
}

export function TeamsList({ myTeams, availableTeams }: TeamsListProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [deleteSubmissions, setDeleteSubmissions] = useState(false)

  function handleCreateTeam(formData: FormData) {
    const name = String(formData.get('name') || '').trim()
    if (!name) return

    setError(null)
    setSuccessMessage(null)

    startTransition(async () => {
      const result = await createTeam(name)

      if ('error' in result) {
        setError(result.error || 'Ukjent feil')
      } else {
        setSuccessMessage('Team opprettet! Siden oppdateres snart...')
        setError(null)
        ;(
          document.querySelector('input[name="name"]') as HTMLInputElement
        ).value = ''
        setTimeout(() => window.location.reload(), 1500)
      }
    })
  }

  function handleJoinTeam(teamId: string) {
    setError(null)
    setSuccessMessage(null)

    startTransition(async () => {
      const result = await joinTeam(teamId)

      if ('error' in result) {
        setError(result.error || 'Kunne ikke bli medlem av team')
      } else {
        setSuccessMessage('Du ble medlem av teamet! Siden oppdateres snart...')
        setTimeout(() => window.location.reload(), 1500)
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
          <h1
            style={{
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}
          >
            <Users size={28} />
            Mine Team
          </h1>
          <p
            style={{
              color: 'var(--color-neutral-600)',
              marginBottom: 'var(--space-2xl)',
            }}
          >
            {myTeams && myTeams.length === 0
              ? 'Du er ikke medlem av noen team ennå. Opprett et nytt team for å komme i gang!'
              : myTeams &&
                `Du er medlem av ${myTeams.length} team${myTeams.length !== 1 ? '' : ''}.`}
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
                  style={{
                    width: '100%',
                    padding: 'var(--space-md)',
                    border: '1px solid var(--color-neutral-300)',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'white',
                    fontSize: 'var(--font-size-base)',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: 'var(--shadow-sm)',
                  }}
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

          {successMessage && (
            <div
              style={{
                padding: 'var(--space-md)',
                backgroundColor: 'var(--color-success-light)',
                color: 'var(--color-success-dark)',
                borderRadius: 'var(--border-radius-md)',
                marginBottom: 'var(--space-lg)',
                fontWeight: '500',
              }}
            >
              ✓ {successMessage}
            </div>
          )}

          {/* My Teams */}
          {myTeams && myTeams.length > 0 && (
            <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  marginBottom: 'var(--space-md)',
                  fontWeight: '700',
                  color: 'var(--color-neutral-900)',
                }}
              >
                Dine Team
              </h2>
              <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
                {myTeams.map((t) => (
                  <Link
                    key={t.id}
                    href={`/t/${t.id}`}
                    style={{
                      display: 'block',
                      padding: 'var(--space-xl)',
                      backgroundColor: 'white',
                      border: '2px solid var(--color-neutral-300)',
                      borderRadius: 'var(--border-radius-lg)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        'var(--shadow-lg)'
                      ;(
                        e.currentTarget as HTMLAnchorElement
                      ).style.borderColor = 'var(--color-primary)'
                      ;(e.currentTarget as HTMLAnchorElement).style.transform =
                        'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        'var(--shadow-md)'
                      ;(
                        e.currentTarget as HTMLAnchorElement
                      ).style.borderColor = 'var(--color-neutral-300)'
                      ;(e.currentTarget as HTMLAnchorElement).style.transform =
                        'translateY(0)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom:
                          t.members && t.members.length > 0
                            ? 'var(--space-md)'
                            : '0',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-md)',
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
                            color: 'var(--color-primary)',
                          }}
                        >
                          <Thermometer size={24} strokeWidth={2} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: '700',
                              fontSize: 'var(--font-size-xl)',
                              color: 'var(--color-neutral-900)',
                              marginBottom: 'var(--space-xs)',
                            }}
                          >
                            {t.name}
                          </div>
                          <div
                            style={{
                              fontSize: 'var(--font-size-sm)',
                              color: 'var(--color-neutral-600)',
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
                            {t.memberCount !== undefined && (
                              <>
                                <span style={{ margin: '0 var(--space-xs)' }}>
                                  ·
                                </span>
                                <Users size={14} />
                                {t.memberCount}{' '}
                                {t.memberCount === 1 ? 'medlem' : 'medlemmer'}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 'var(--font-size-2xl)',
                          color: 'var(--color-primary)',
                          fontWeight: '700',
                        }}
                      >
                        →
                      </span>
                    </div>

                    {/* Member list */}
                    {t.members && t.members.length > 0 && (
                      <div
                        style={{
                          paddingTop: 'var(--space-md)',
                          borderTop: '1px solid var(--color-neutral-200)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 'var(--space-sm)',
                        }}
                      >
                        {t.members.map((m) => (
                          <div
                            key={m.user_id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-xs)',
                              padding: 'var(--space-xs) var(--space-sm)',
                              backgroundColor: 'var(--color-neutral-100)',
                              borderRadius: 'var(--border-radius-md)',
                              fontSize: 'var(--font-size-sm)',
                              color: 'var(--color-neutral-700)',
                              position: 'relative',
                              paddingRight:
                                t.role === 'owner' && m.role !== 'owner'
                                  ? 'calc(var(--space-sm) + 24px)'
                                  : 'var(--space-sm)',
                            }}
                          >
                            {m.role === 'owner' && <Crown size={12} />}
                            {m.role === 'admin' && <Settings size={12} />}
                            {m.role === 'member' && <User size={12} />}
                            <span>{m.email}</span>

                            {/* Remove button - only show for owner, and not for other owners */}
                            {t.role === 'owner' && m.role !== 'owner' && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  setRemovingMemberId(m.user_id)
                                  setDeleteSubmissions(false)
                                }}
                                style={{
                                  position: 'absolute',
                                  right: 'var(--space-xs)',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--color-error)',
                                  opacity: '0.6',
                                  transition: 'opacity 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  ;(
                                    e.target as HTMLButtonElement
                                  ).style.opacity = '1'
                                }}
                                onMouseLeave={(e) => {
                                  ;(
                                    e.target as HTMLButtonElement
                                  ).style.opacity = '0.6'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Available Teams */}
          {availableTeams && availableTeams.length > 0 && (
            <div
              style={{
                display: 'grid',
                gap: 'var(--space-xl)',
                marginTop: 'var(--space-3xl)',
              }}
            >
              <h2
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  marginBottom: 'var(--space-md)',
                  fontWeight: '700',
                  color: 'var(--color-neutral-900)',
                }}
              >
                Tilgjengelige Team
              </h2>
              <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
                {availableTeams.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-xl)',
                      backgroundColor: 'white',
                      border: '2px solid var(--color-neutral-300)',
                      borderRadius: 'var(--border-radius-lg)',
                      color: 'inherit',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-md)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '48px',
                          height: '48px',
                          backgroundColor: 'var(--color-secondary-dark)',
                          borderRadius: 'var(--border-radius-md)',
                          color: 'white',
                          opacity: 0.7,
                        }}
                      >
                        <Thermometer size={24} strokeWidth={2} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: '700',
                            fontSize: 'var(--font-size-xl)',
                            color: 'var(--color-neutral-900)',
                            marginBottom: 'var(--space-xs)',
                          }}
                        >
                          {t.name}
                        </div>
                        <div
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-neutral-600)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-xs)',
                          }}
                        >
                          <Users size={14} />
                          Åpent team
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJoinTeam(t.id)}
                      disabled={isPending}
                      style={{
                        padding: 'var(--space-md) var(--space-lg)',
                        backgroundColor: isPending
                          ? 'var(--color-neutral-300)'
                          : 'var(--color-secondary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--border-radius-md)',
                        fontWeight: '700',
                        cursor: isPending ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        if (!isPending) {
                          ;(
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor =
                            'var(--color-secondary-dark)'
                          ;(
                            e.currentTarget as HTMLButtonElement
                          ).style.boxShadow = 'var(--shadow-lg)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isPending) {
                          ;(
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = 'var(--color-secondary)'
                          ;(
                            e.currentTarget as HTMLButtonElement
                          ).style.boxShadow = 'none'
                        }
                      }}
                    >
                      {isPending ? '⏳ Blir medlem...' : '✨ Bli medlem'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!myTeams ||
            (myTeams.length === 0 &&
              (!availableTeams || availableTeams.length === 0) && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 'var(--space-3xl) var(--space-xl)',
                    color: 'var(--color-neutral-600)',
                  }}
                >
                  <p style={{ marginBottom: 'var(--space-md)' }}>
                    Ingen team funnet. Opprett ditt første team eller vent på
                    invitasjon.
                  </p>
                </div>
              ))}

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

      {/* Member removal dialog */}
      {removingMemberId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setRemovingMemberId(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--border-radius-lg)',
              padding: 'var(--space-xl)',
              maxWidth: '400px',
              width: '90%',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-lg)',
              }}
            >
              <h2
                style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700' }}
              >
                Fjern medlem
              </h2>
              <button
                onClick={() => setRemovingMemberId(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--color-neutral-600)',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p
              style={{
                marginBottom: 'var(--space-lg)',
                color: 'var(--color-neutral-700)',
                lineHeight: '1.5',
              }}
            >
              Du er i ferd med å fjerne dette medlemmet fra teamet. Hva skal
              gjøres med deres tidligere innsendte svar?
            </p>

            <div
              style={{
                backgroundColor: 'var(--color-neutral-50)',
                border: '1px solid var(--color-neutral-200)',
                borderRadius: 'var(--border-radius-md)',
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-lg)',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  cursor: 'pointer',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <input
                  type="radio"
                  name="deleteSubmissions"
                  value="false"
                  checked={!deleteSubmissions}
                  onChange={() => setDeleteSubmissions(false)}
                  style={{ cursor: 'pointer' }}
                />
                <div>
                  <div
                    style={{
                      fontWeight: '600',
                      color: 'var(--color-neutral-900)',
                    }}
                  >
                    Behold svarene
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-neutral-600)',
                    }}
                  >
                    Medlemmets tidligere svar vil forbli i systemet
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="deleteSubmissions"
                  value="true"
                  checked={deleteSubmissions}
                  onChange={() => setDeleteSubmissions(true)}
                  style={{ cursor: 'pointer' }}
                />
                <div>
                  <div
                    style={{ fontWeight: '600', color: 'var(--color-error)' }}
                  >
                    Slett svarene
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-neutral-600)',
                    }}
                  >
                    Alle tidligere innsendte svar fra medlemmet slettes
                    permanent
                  </div>
                </div>
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 'var(--space-md)',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setRemovingMemberId(null)}
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  backgroundColor: 'var(--color-neutral-200)',
                  color: 'var(--color-neutral-900)',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  ;(
                    e.currentTarget as HTMLButtonElement
                  ).style.backgroundColor = 'var(--color-neutral-300)'
                }}
                onMouseLeave={(e) => {
                  ;(
                    e.currentTarget as HTMLButtonElement
                  ).style.backgroundColor = 'var(--color-neutral-200)'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  startTransition(async () => {
                    const teamId =
                      myTeams.find((t) =>
                        t.members?.some((m) => m.user_id === removingMemberId)
                      )?.id || ''

                    const result = await removeMember(
                      teamId,
                      removingMemberId || '',
                      deleteSubmissions
                    )

                    if ('error' in result) {
                      setError(result.error || 'Ukjent feil')
                    } else {
                      setSuccessMessage('Medlem fjernet fra teamet')
                      setRemovingMemberId(null)
                      setTimeout(() => window.location.reload(), 1500)
                    }
                  })
                }}
                disabled={isPending}
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  backgroundColor: 'var(--color-error)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: isPending ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {isPending ? 'Fjerner...' : 'Fjern medlem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
