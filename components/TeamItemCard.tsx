'use client'

import {
  addMemberTag,
  deleteItem,
  updateItem,
  type TeamItem,
} from '@/server/actions/dashboard'
import { AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PersonChip } from './PersonChip'
import { SystemTagInput } from './SystemTagInput'

interface TeamItemCardProps {
  item: TeamItem
  teamMembers: Array<{ id: string; email: string }>
  onUpdate?: () => void
}

type ItemStatus = 'planlagt' | 'pågår' | 'ferdig'

export function TeamItemCard({
  item,
  teamMembers,
  onUpdate,
}: TeamItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSaveTitle = async () => {
    if (title.trim() && title !== item.title) {
      try {
        const result = await updateItem(item.id, { title: title.trim() })
        if (result.error) {
          setError(result.error)
          return
        }
        setError(null)
        router.refresh()
        onUpdate?.()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Ukjent feil'
        setError(msg)
      }
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    try {
      const result = await deleteItem(item.id)

      if (result.error) {
        setError(result.error)
        return
      }

      setError(null)
      router.refresh()
      onUpdate?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ukjent feil'
      setError(msg)
    }
  }

  const handleStatusChange = async (newStatus: ItemStatus) => {
    try {
      const result = await updateItem(item.id, { status: newStatus })
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      router.refresh()
      onUpdate?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ukjent feil'
      setError(msg)
    }
  }

  const handleAddMember = async (userId: string) => {
    try {
      const result = await addMemberTag(item.id, userId)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setShowMemberDropdown(false)
      router.refresh()
      onUpdate?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ukjent feil'
      setError(msg)
    }
  }

  const handleTagUpdate = () => {
    // revalidatePath is already called on the server side, no need for router.refresh
    onUpdate?.()
  }

  const assignedUserIds = item.members.map((m) => m.user_id)
  const availableMembers = teamMembers.filter(
    (m) => !assignedUserIds.includes(m.id)
  )

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg, 0.5rem)',
        padding: 'var(--space-lg)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid var(--color-neutral-200, #e5e5e5)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--color-error, #ef4444)',
            padding: 'var(--space-sm)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-md)',
        }}
      >
        {/* Status dropdown for all item types */}
        <div style={{ marginTop: '2px' }}>
          <select
            value={item.status}
            onChange={(e) => handleStatusChange(e.target.value as ItemStatus)}
            style={{
              padding: 'var(--space-xs) var(--space-sm)',
              border: '1px solid var(--color-neutral-300)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
            }}
          >
            <option value="planlagt">◆ Planlagt</option>
            <option value="pågår">▶ Pågår</option>
            <option value="ferdig">● Ferdig</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveTitle()
                if (e.key === 'Escape') {
                  setTitle(item.title)
                  setIsEditing(false)
                }
              }}
              autoFocus
              style={{
                width: '100%',
                padding: 'var(--space-sm)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-base)',
              }}
            />
          ) : (
            <p
              onClick={() => setIsEditing(true)}
              style={{
                margin: 0,
                cursor: 'text',
                fontSize: 'var(--font-size-base)',
                lineHeight: 1.5,
              }}
            >
              {item.title}
            </p>
          )}
        </div>

        <button
          onClick={() => {
            void handleDelete()
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-neutral-500)',
            fontSize: '1.5rem',
            padding: 'var(--space-xs)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-error, #ef4444)'
            e.currentTarget.style.transform = 'scale(1.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-neutral-500)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Slett oppgave"
        >
          🗑️
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-xs)',
            alignItems: 'center',
          }}
        >
          {item.members.map((member) => {
            const user = teamMembers.find((m) => m.id === member.user_id)
            return (
              <PersonChip
                key={member.user_id}
                userId={member.user_id}
                displayName={user?.email.split('@')[0] || 'Ukjent'}
                itemId={item.id}
                onUpdate={handleTagUpdate}
              />
            )
          })}

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMemberDropdown(!showMemberDropdown)}
              style={{
                padding: 'var(--space-xs) var(--space-sm)',
                backgroundColor: 'var(--color-neutral-100)',
                border: '1px dashed var(--color-neutral-400)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              + Legg til person
            </button>

            {showMemberDropdown && availableMembers.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 'var(--space-xs)',
                  backgroundColor: 'white',
                  border: '1px solid var(--color-neutral-300)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 10,
                  minWidth: '200px',
                }}
              >
                {availableMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleAddMember(member.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 'var(--space-sm)',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'var(--color-neutral-100)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {member.email.split('@')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <SystemTagInput
          itemId={item.id}
          teamId={item.team_id}
          existingTags={item.tags.map((t) => t.tag_name)}
          onUpdate={handleTagUpdate}
        />
      </div>
    </div>
  )
}
