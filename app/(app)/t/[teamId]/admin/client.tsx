'use client'

import {
  deleteUserSubmissions,
  getUsersWithSubmissions,
} from '@/server/actions/teams'
import { useState, useTransition } from 'react'

interface UserWithSubmissions {
  user_id: string
  email: string
  submission_count: number
  latest_submission: string
  is_current_member: boolean
  member_role: string | null
}

export default function AdminUsersWithSubmissions({
  teamId,
  initialUsers,
}: {
  teamId: string
  initialUsers: UserWithSubmissions[]
}) {
  const [users, setUsers] = useState<UserWithSubmissions[]>(initialUsers)
  const [isPending, startTransition] = useTransition()
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const handleDelete = async (userId: string, email: string) => {
    if (
      !confirm(
        `Er du sikker på at du vil slette alle besvarelser fra ${email}? Dette kan ikke angres.`
      )
    ) {
      return
    }

    setDeletingUserId(userId)
    startTransition(async () => {
      const result = await deleteUserSubmissions(teamId, userId)

      if (result.error) {
        alert('Feil: ' + result.error)
        setDeletingUserId(null)
        return
      }

      alert(`Slettet ${result.count} besvarelser`)

      // Refresh the list
      const refreshResult = await getUsersWithSubmissions(teamId)
      if (!refreshResult.error && refreshResult.data) {
        setUsers(refreshResult.data)
      }

      setDeletingUserId(null)
    })
  }

  if (users.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--color-neutral-500)',
          backgroundColor: 'var(--color-neutral-100)',
          border: '1px solid var(--color-neutral-200)',
          borderRadius: '1rem',
        }}
      >
        Ingen besvarelser funnet i dette teamet.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-lg)', padding: '2rem' }}>
      <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
        <h2
          style={{
            marginBottom: 0,
            fontSize: 'var(--font-size-2xl)',
            color: 'var(--color-neutral-900)',
          }}
        >
          Administrer besvarelser
        </h2>
        <p
          style={{
            marginBottom: 0,
            color: 'var(--color-neutral-600)',
            fontSize: 'var(--font-size-sm)',
            maxWidth: '54rem',
          }}
        >
          Her kan du slette besvarelser fra nåværende og tidligere medlemmer.
          Tidligere medlemmer vises dempet, men historikken deres er fortsatt
          bevart.
        </p>
      </div>

      <div
        style={{
          border: '1px solid var(--color-neutral-200)',
          borderRadius: '1rem',
          backgroundColor: 'var(--color-neutral-100)',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-neutral-50)',
                borderBottom: '1px solid var(--color-neutral-200)',
              }}
            >
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: 600,
                }}
              >
                Bruker
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: 600,
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                Besvarelser
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: 600,
                }}
              >
                Siste besvarelse
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                Handling
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.user_id}
                style={{
                  borderBottom: '1px solid var(--color-neutral-200)',
                  backgroundColor: user.is_current_member
                    ? 'var(--color-neutral-100)'
                    : 'var(--color-neutral-50)',
                }}
              >
                <td
                  style={{
                    padding: '1rem',
                    color: user.is_current_member
                      ? 'var(--color-neutral-900)'
                      : 'var(--color-neutral-500)',
                  }}
                >
                  {user.email}
                </td>
                <td style={{ padding: '1rem' }}>
                  {user.is_current_member ? (
                    <span
                      style={{
                        backgroundColor: 'var(--color-success-light)',
                        color: 'var(--color-success-dark)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 500,
                      }}
                    >
                      Aktivt medlem ({user.member_role})
                    </span>
                  ) : (
                    <span
                      style={{
                        backgroundColor: 'var(--color-neutral-50)',
                        color: 'var(--color-neutral-600)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 500,
                      }}
                    >
                      Tidligere medlem
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  {user.submission_count}
                </td>
                <td
                  style={{
                    padding: '1rem',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-neutral-600)',
                  }}
                >
                  {new Date(user.latest_submission).toLocaleDateString(
                    'no-NO',
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDelete(user.user_id, user.email)}
                    disabled={
                      isPending ||
                      deletingUserId === user.user_id ||
                      user.submission_count === 0
                    }
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor:
                        isPending ||
                        deletingUserId === user.user_id ||
                        user.submission_count === 0
                          ? 'var(--color-neutral-200)'
                          : 'var(--color-error)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '999px',
                      cursor:
                        isPending ||
                        deletingUserId === user.user_id ||
                        user.submission_count === 0
                          ? 'not-allowed'
                          : 'pointer',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 500,
                      opacity:
                        isPending ||
                        deletingUserId === user.user_id ||
                        user.submission_count === 0
                          ? 0.6
                          : 1,
                    }}
                  >
                    {deletingUserId === user.user_id
                      ? 'Sletter...'
                      : 'Slett besvarelser'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--color-warning-light)',
          border: '1px solid var(--color-warning)',
          borderRadius: '1rem',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-primary-dark)',
        }}
      >
        <strong>Advarsel:</strong> Når du sletter besvarelser fjernes de
        permanent fra databasen og påvirker teamets statistikk og historikk.
        Denne handlingen kan ikke angres.
      </div>
    </div>
  )
}
