'use client'

import {
  addMemberTag,
  deleteItem,
  updateItem,
  type TeamItem,
} from '@/server/actions/dashboard'
import { AlertCircle, Loader, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PersonChip } from './PersonChip'
import { SystemTagInput } from './SystemTagInput'

interface TeamItemCardProps {
  item: TeamItem
  teamMembers: Array<{ id: string; firstName: string }>
  userRole: string
  onUpdate?: () => void
}

type ItemStatus = 'planlagt' | 'pågår' | 'ferdig'

export function TeamItemCard({
  item,
  teamMembers,
  userRole,
  onUpdate,
}: TeamItemCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStatusChanging, setIsStatusChanging] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleSaveTitle = async () => {
    if (title.trim() && title !== item.title) {
      setIsSaving(true)
      setStatusMessage('Lagrer...')
      try {
        const result = await updateItem(item.id, { title: title.trim() })
        if (result.error) {
          setError(result.error)
          setStatusMessage(null)
          return
        }
        setError(null)
        setStatusMessage('✓ Lagret')
        setTimeout(() => setStatusMessage(null), 2000)
        onUpdate?.()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Ukjent feil'
        setError(msg)
        setStatusMessage(null)
      } finally {
        setIsSaving(false)
      }
    }
    setIsEditingTitle(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setStatusMessage('Sletter...')
    try {
      const result = await deleteItem(item.id)

      if (result.error) {
        setError(result.error)
        setStatusMessage(null)
        return
      }

      setError(null)
      setStatusMessage('✓ Slettet')
      setTimeout(() => setStatusMessage(null), 2000)
      onUpdate?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ukjent feil'
      setError(msg)
      setStatusMessage(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (newStatus: ItemStatus) => {
    setIsStatusChanging(true)
    setStatusMessage('Oppdaterer status...')
    try {
      const result = await updateItem(item.id, { status: newStatus })
      if (result.error) {
        setError(result.error)
        setStatusMessage(null)
        return
      }
      setError(null)
      setStatusMessage('✓ Status oppdatert')
      setTimeout(() => setStatusMessage(null), 2000)
      onUpdate?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ukjent feil'
      setError(msg)
      setStatusMessage(null)
    } finally {
      setIsStatusChanging(false)
    }
  }

  const handleAddMember = async (userId: string) => {
    setIsAddingMember(true)
    setStatusMessage('Legger til medlem...')
    try {
      const result = await addMemberTag(item.id, userId)
      if (result.error) {
        setError(result.error)
        setStatusMessage(null)
        return
      }
      setError(null)
      setStatusMessage('✓ Medlem lagt til')
      setTimeout(() => setStatusMessage(null), 2000)
      setShowMemberDropdown(false)
      onUpdate?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ukjent feil'
      setError(msg)
      setStatusMessage(null)
    } finally {
      setIsAddingMember(false)
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

  // Get background color based on status (Nordic nature palette)
  const getBackgroundColor = (): string => {
    switch (item.status) {
      case 'planlagt':
        return '#E3F2FD' // Light blue - planned
      case 'pågår':
        return '#FFFACD' // Light yellow - in progress
      case 'ferdig':
        return '#E8F5E9' // Light green - done
      default:
        return 'white'
    }
  }

  return (
    <div
      style={{
        backgroundColor: getBackgroundColor(),
        borderRadius: 'var(--radius-lg, 0.5rem)',
        padding: 'var(--space-md)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid var(--color-neutral-200, #e5e5e5)',
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: 1,
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
      {statusMessage && (
        <div
          style={{
            backgroundColor: statusMessage.startsWith('✓')
              ? 'rgba(34, 197, 94, 0.1)'
              : 'rgba(96, 165, 250, 0.1)',
            color: statusMessage.startsWith('✓') ? '#22c55e' : '#3b82f6',
            padding: 'var(--space-sm)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            marginBottom: 'var(--space-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
          }}
        >
          {statusMessage.startsWith('✓') ? (
            <span>✓</span>
          ) : (
            <Loader
              size={16}
              style={{ animation: 'spin 1s linear infinite' }}
            />
          )}
          {statusMessage}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-xs)',
          marginBottom: isEditMode ? 'var(--space-md)' : 0,
        }}
      >
        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveTitle()
                if (e.key === 'Escape') {
                  setTitle(item.title)
                  setIsEditingTitle(false)
                }
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '4px 6px',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            />
          ) : (
            <>
              <p
                onClick={() => {
                  setIsEditingTitle(true)
                  setIsEditMode(true)
                }}
                style={{
                  margin: 0,
                  cursor: 'text',
                  fontSize: '13px',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  marginBottom:
                    item.tags.length > 0 || item.members.length > 0
                      ? 'var(--space-xs)'
                      : 0,
                }}
              >
                {item.title}
              </p>

              {/* Tags in view mode */}
              {item.tags.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginBottom: item.members.length > 0 ? '4px' : 0,
                  }}
                >
                  {item.tags.map((tag) => (
                    <span
                      key={tag.tag_name}
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--color-primary, #3b82f6)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tag.tag_name}
                    </span>
                  ))}
                </div>
              )}

              {/* Members in view mode */}
              {item.members.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                  }}
                >
                  {item.members.map((member) => {
                    const user = teamMembers.find(
                      (m) => m.id === member.user_id
                    )
                    const initials = user?.firstName
                      ? user.firstName.substring(0, 2).toUpperCase()
                      : '?'
                    return (
                      <span
                        key={member.user_id}
                        title={user?.firstName || 'Ukjent'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          backgroundColor: 'var(--color-primary, #3b82f6)',
                          color: 'white',
                          borderRadius: '50%',
                          fontSize: '10px',
                          fontWeight: 600,
                        }}
                      >
                        {initials}
                      </span>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit button (pencil) - only for non-viewers */}
        {userRole !== 'viewer' && (
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            disabled={isSaving || isDeleting}
            style={{
              background: 'none',
              border: 'none',
              cursor: isSaving || isDeleting ? 'not-allowed' : 'pointer',
              color: isEditMode
                ? 'var(--color-primary)'
                : 'var(--color-neutral-500)',
              padding: 'var(--space-xs)',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              opacity: isSaving || isDeleting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSaving && !isDeleting) {
                e.currentTarget.style.color = 'var(--color-primary)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isEditMode
                ? 'var(--color-primary)'
                : 'var(--color-neutral-500)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Rediger"
          >
            {isSaving ? (
              <Loader
                size={18}
                style={{ animation: 'spin 1s linear infinite' }}
              />
            ) : (
              <Pencil size={18} />
            )}
          </button>
        )}

        {/* Delete button (trash) - only for non-viewers */}
        {userRole !== 'viewer' && (
          <button
            onClick={() => {
              void handleDelete()
            }}
            disabled={isDeleting || isSaving}
            style={{
              background: 'none',
              border: 'none',
              cursor: isDeleting || isSaving ? 'not-allowed' : 'pointer',
              color: 'var(--color-neutral-500)',
              padding: 'var(--space-xs)',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isDeleting || isSaving ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting && !isSaving) {
                e.currentTarget.style.color = 'var(--color-error, #ef4444)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-neutral-500)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Slett oppgave"
          >
            {isDeleting ? (
              <Loader
                size={18}
                style={{ animation: 'spin 1s linear infinite' }}
              />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        )}
      </div>

      {isEditMode && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
          }}
        >
          {/* Status dropdown (only in edit mode) */}
          <div style={{ flexShrink: 0 }}>
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(e.target.value as ItemStatus)}
              disabled={isStatusChanging}
              style={{
                padding: '4px 6px',
                border: '1px solid var(--color-neutral-300)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                cursor: isStatusChanging ? 'not-allowed' : 'pointer',
                opacity: isStatusChanging ? 0.6 : 1,
              }}
            >
              <option value="planlagt">◆ Planlagt</option>
              <option value="pågår">▶ Pågår</option>
              <option value="ferdig">● Ferdig</option>
            </select>
          </div>

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
                  displayName={user?.firstName || 'Ukjent'}
                  itemId={item.id}
                  onUpdate={handleTagUpdate}
                />
              )
            })}

            <div style={{ position: 'relative', zIndex: 50 }}>
              <button
                onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                disabled={isAddingMember}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--color-neutral-100)',
                  border: '1px dashed var(--color-neutral-400)',
                  borderRadius: 'var(--radius-full)',
                  cursor: isAddingMember ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  opacity: isAddingMember ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isAddingMember ? (
                  <>
                    <Loader
                      size={12}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    Legger til...
                  </>
                ) : (
                  '+ Legg til person'
                )}
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
                    zIndex: 9999,
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
                      {member.firstName}
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
      )}
    </div>
  )
}
