'use client'

import { adminUpdateUserFirstName } from '@/server/actions/auth'
import { updateMemberIncludeInStats } from '@/server/actions/teams'
import { AlertCircle, Check } from 'lucide-react'
import { useState } from 'react'

interface TeamMember {
  user_id: string
  email: string
  first_name?: string
  role: string
  include_in_stats: boolean
}

interface AdminUserProfilesProps {
  teamId: string
  teamMembers: TeamMember[]
}

export function AdminUserProfiles({
  teamId,
  teamMembers,
}: AdminUserProfilesProps) {
  const [members, setMembers] = useState(teamMembers)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [message, setMessage] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)
  const [saving, setSaving] = useState(false)

  const handleEdit = (member: TeamMember) => {
    setEditingId(member.user_id)
    setEditValue(member.first_name || '')
    setMessage(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSave = async (userId: string) => {
    if (!editValue.trim()) {
      setMessage({ type: 'error', text: 'Fornavn kan ikke være tomt' })
      return
    }

    setSaving(true)
    try {
      const result = await adminUpdateUserFirstName(userId, editValue, teamId)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
        setSaving(false)
        return
      }

      // Update local state
      setMembers(
        members.map((m) =>
          m.user_id === userId ? { ...m, first_name: editValue } : m
        )
      )

      setMessage({
        type: 'success',
        text: `Fornavn oppdatert for ${editValue}`,
      })
      setEditingId(null)
      setEditValue('')

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ukjent feil'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleIncludeInStats = async (
    userId: string,
    currentValue: boolean
  ) => {
    const newValue = !currentValue

    try {
      const result = await updateMemberIncludeInStats(teamId, userId, newValue)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
        setTimeout(() => setMessage(null), 5000)
        return
      }

      // Update local state
      setMembers(
        members.map((m) =>
          m.user_id === userId ? { ...m, include_in_stats: newValue } : m
        )
      )

      setMessage({
        type: 'success',
        text: newValue
          ? 'Bruker inkludert i statistikk ✓'
          : 'Bruker ekskludert fra statistikk',
      })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ukjent feil'
      setMessage({ type: 'error', text: errorMsg })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const membersWithoutNames = members.filter((m) => !m.first_name)

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Bruker-fornavn</h2>
        <p
          style={{ color: 'var(--color-neutral-600)', marginBottom: '1.5rem' }}
        >
          {membersWithoutNames.length > 0
            ? `${membersWithoutNames.length} bruker(e) mangler fornavn`
            : 'Alle brukere har fornavn satt ✓'}
        </p>

        {message && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor:
                message.type === 'error'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(34, 197, 94, 0.1)',
              color:
                message.type === 'error'
                  ? 'var(--color-error, #ef4444)'
                  : 'var(--color-success, #22c55e)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {message.type === 'error' ? (
              <AlertCircle size={18} />
            ) : (
              <Check size={18} />
            )}
            {message.text}
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          border: '1px solid var(--color-neutral-200)',
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
            <tr style={{ backgroundColor: 'var(--color-neutral-50)' }}>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '1px solid var(--color-neutral-200)',
                }}
              >
                E-post
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '1px solid var(--color-neutral-200)',
                }}
              >
                Fornavn
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '1px solid var(--color-neutral-200)',
                }}
              >
                Rolle
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '1px solid var(--color-neutral-200)',
                }}
              >
                Inkludert i statistikk
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '1px solid var(--color-neutral-200)',
                }}
              >
                Handlinger
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.user_id}
                style={{
                  borderBottom: '1px solid var(--color-neutral-200)',
                }}
              >
                <td
                  style={{
                    padding: '1rem',
                    fontSize: '0.875rem',
                    color: 'var(--color-neutral-700)',
                  }}
                >
                  {member.email}
                </td>
                <td
                  style={{
                    padding: '1rem',
                  }}
                >
                  {editingId === member.user_id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Skriv fornavn..."
                      autoFocus
                      style={{
                        padding: '0.5rem',
                        border: '1px solid var(--color-primary)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        width: '100%',
                        maxWidth: '250px',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        color: member.first_name
                          ? 'var(--color-neutral-900)'
                          : 'var(--color-neutral-400)',
                      }}
                    >
                      {member.first_name || '(ingen)'}
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: '1rem',
                    fontSize: '0.875rem',
                  }}
                >
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor:
                        member.role === 'external'
                          ? 'rgba(168, 85, 247, 0.1)'
                          : member.role === 'owner'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : member.role === 'admin'
                              ? 'rgba(59, 130, 246, 0.1)'
                              : 'rgba(34, 197, 94, 0.1)',
                      color:
                        member.role === 'external'
                          ? '#7c3aed'
                          : member.role === 'owner'
                            ? '#dc2626'
                            : member.role === 'admin'
                              ? '#2563eb'
                              : '#16a34a',
                    }}
                  >
                    {member.role === 'external'
                      ? 'Ekstern'
                      : member.role === 'owner'
                        ? 'Eier'
                        : member.role === 'admin'
                          ? 'Admin'
                          : member.role === 'member'
                            ? 'Medlem'
                            : 'Viewer'}
                  </span>
                </td>
                <td
                  style={{
                    padding: '1rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {member.role === 'external' ? (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={member.include_in_stats}
                        onChange={() =>
                          handleToggleIncludeInStats(
                            member.user_id,
                            member.include_in_stats
                          )
                        }
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{ color: 'var(--color-neutral-700)' }}>
                        {member.include_in_stats ? 'Ja' : 'Nei'}
                      </span>
                    </label>
                  ) : (
                    <span
                      style={{
                        color: 'var(--color-neutral-500)',
                        fontSize: '0.875rem',
                      }}
                    >
                      Ja (alltid)
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: '1rem',
                  }}
                >
                  {editingId === member.user_id ? (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                      }}
                    >
                      <button
                        onClick={() => handleSave(member.user_id)}
                        disabled={saving}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--color-primary, #3b82f6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.6 : 1,
                          fontSize: '0.875rem',
                          fontWeight: '500',
                        }}
                      >
                        {saving ? 'Lagres...' : 'Lagre'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--color-neutral-100)',
                          color: 'var(--color-neutral-700)',
                          border: '1px solid var(--color-neutral-300)',
                          borderRadius: '0.375rem',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                        }}
                      >
                        Avbryt
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(member)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--color-neutral-100)',
                        color: 'var(--color-neutral-700)',
                        border: '1px solid var(--color-neutral-300)',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                      }}
                      onMouseEnter={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement
                        btn.style.backgroundColor = 'var(--color-neutral-200)'
                      }}
                      onMouseLeave={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement
                        btn.style.backgroundColor = 'var(--color-neutral-100)'
                      }}
                    >
                      Rediger
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {members.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--color-neutral-500)',
          }}
        >
          Ingen team-medlemmer funnet
        </div>
      )}
    </div>
  )
}
