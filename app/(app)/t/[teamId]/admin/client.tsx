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
          color: '#666',
        }}
      >
        Ingen besvarelser funnet i dette teamet.
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
        Administrer besvarelser
      </h2>
      <p
        style={{
          marginBottom: '2rem',
          color: '#666',
          fontSize: '0.9rem',
        }}
      >
        Her kan du slette besvarelser fra nåværende og tidligere medlemmer. Merk
        at tidligere medlemmer (vist i grått) ikke lenger har tilgang til
        teamet, men deres besvarelser er bevart i historikken.
      </p>

      <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: '#f5f5f5',
                borderBottom: '2px solid #e0e0e0',
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
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: user.is_current_member ? '#fff' : '#f9f9f9',
                }}
              >
                <td
                  style={{
                    padding: '1rem',
                    color: user.is_current_member ? '#000' : '#999',
                  }}
                >
                  {user.email}
                </td>
                <td style={{ padding: '1rem' }}>
                  {user.is_current_member ? (
                    <span
                      style={{
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      Aktivt medlem ({user.member_role})
                    </span>
                  ) : (
                    <span
                      style={{
                        backgroundColor: '#f5f5f5',
                        color: '#757575',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
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
                    fontSize: '0.875rem',
                    color: '#666',
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
                          ? '#e0e0e0'
                          : '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor:
                        isPending ||
                        deletingUserId === user.user_id ||
                        user.submission_count === 0
                          ? 'not-allowed'
                          : 'pointer',
                      fontSize: '0.875rem',
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
          padding: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          fontSize: '0.875rem',
        }}
      >
        <strong>⚠️ Advarsel:</strong> Når du sletter besvarelser fjernes de
        permanent fra databasen og påvirker teamets statistikk og historikk.
        Denne handlingen kan ikke angres.
      </div>
    </div>
  )
}
