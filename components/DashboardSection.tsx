'use client'

import {
  createItem,
  reorderItem,
  type ItemRelation,
  type TeamItem,
} from '@/server/actions/dashboard'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState } from 'react'
import { TeamItemCard } from './TeamItemCard'

type ItemType = 'ukemål' | 'pipeline' | 'mål' | 'retro'

// Nordic nature colors
const NORDIC_COLORS: Record<ItemType, { accent: string; light: string }> = {
  ukemål: {
    accent: 'var(--color-neutral-600)',
    light: 'var(--color-neutral-100)',
  },
  pipeline: {
    accent: 'var(--color-secondary-dark)',
    light: 'var(--color-success-light)',
  },
  mål: { accent: 'var(--color-primary-dark)', light: 'var(--color-mist)' },
  retro: { accent: 'var(--color-bark)', light: 'var(--color-sand)' },
}

// Wrapper component to make TeamItemCard sortable
function SortableItemWrapper({
  item,
  teamMembers,
  allRelations,
  onRefetch,
  userRole,
}: {
  item: TeamItem
  teamMembers: Array<{ id: string; firstName: string }>
  allRelations: ItemRelation[]
  onRefetch?: () => Promise<void>
  userRole: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Filter relations for this specific item
  const itemRelations = {
    inbound: allRelations.filter((r) => r.target_item_id === item.id),
    outbound: allRelations.filter((r) => r.source_item_id === item.id),
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TeamItemCard
        item={item}
        teamMembers={teamMembers}
        relations={itemRelations}
        onRefetch={onRefetch}
        userRole={userRole}
      />
    </div>
  )
}

interface DashboardSectionProps {
  title: string
  type: ItemType
  items: TeamItem[]
  allRelations?: ItemRelation[]
  teamId: string
  teamMembers: Array<{ id: string; firstName: string }>
  userRole: string
  onOptimisticAdd?: (item: TeamItem) => void
  onOptimisticRemove?: (itemId: string) => void
  onOptimisticReplace?: (tempId: string, realId: string) => void
  onRefetch?: () => Promise<void>
}

export function DashboardSection({
  title,
  type,
  items,
  allRelations = [],
  teamId,
  teamMembers,
  userRole,
  onOptimisticAdd,
  onOptimisticRemove,
  onOptimisticReplace,
  onRefetch,
}: DashboardSectionProps) {
  const colors = NORDIC_COLORS[type]
  const canEdit = userRole !== 'viewer' && userRole !== 'external'
  const [isAdding, setIsAdding] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sortedItems, setSortedItems] = useState<TeamItem[]>(
    [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  )

  // Re-sync sorted items when items prop changes
  useEffect(() => {
    setSortedItems(
      [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    )
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Require 10px drag distance to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddItem = async () => {
    if (newItemTitle.trim()) {
      // Create optimistic item with temp ID
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const optimisticItem: TeamItem = {
        id: tempId,
        team_id: teamId,
        type: type,
        title: newItemTitle.trim(),
        status: 'planlagt',
        sort_order: items.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: null,
        archived_at: null,
        archived_by: null,
        members: [],
        tags: [],
      }

      // Immediately add to UI (optimistic)
      onOptimisticAdd?.(optimisticItem)

      // Reset form
      setNewItemTitle('')
      setIsAdding(false)
      setErrorMsg(null)

      // Sync with server in background
      try {
        const result = await createItem(teamId, type, optimisticItem.title)
        if (result.error) {
          // Remove optimistic item on error
          onOptimisticRemove?.(tempId)
          setErrorMsg(result.error)
          setIsAdding(true) // Re-open form
          setNewItemTitle(optimisticItem.title) // Restore title
          return
        }

        // Replace temp ID with real ID
        if (result.itemId) {
          onOptimisticReplace?.(tempId, result.itemId)
        }
      } catch (err) {
        // Remove optimistic item on error
        onOptimisticRemove?.(tempId)
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setErrorMsg(msg)
        setIsAdding(true) // Re-open form
        setNewItemTitle(optimisticItem.title) // Restore title
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id)
      const newIndex = sortedItems.findIndex((item) => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSortedItems = arrayMove(sortedItems, oldIndex, newIndex)
        setSortedItems(newSortedItems)

        // Update sort_order in database for items that moved
        for (let i = 0; i < newSortedItems.length; i++) {
          const item = newSortedItems[i]
          if (item && (item.sort_order || 0) !== i) {
            await reorderItem(item.id, i, teamId)
          }
        }

        await onRefetch?.()
      }
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 'var(--space-md)',
          borderBottom: `3px solid ${colors.accent}`,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'var(--font-size-xl, 1.25rem)',
            fontWeight: 600,
            color: colors.accent,
          }}
        >
          {title}
        </h2>

        {!isAdding && canEdit && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
            }}
          >
            + Legg til
          </button>
        )}
      </div>

      {isAdding && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
          }}
        >
          {errorMsg && (
            <p
              style={{
                color: 'var(--color-error)',
                fontSize: 'var(--font-size-sm)',
                margin: 0,
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--color-error-light)',
                borderRadius: 'var(--border-radius-md)',
              }}
            >
              {errorMsg}
            </p>
          )}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
            }}
          >
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => {
                // Stop event propagation to prevent drag-and-drop handlers from eating space
                e.stopPropagation()
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleAddItem()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setIsAdding(false)
                  setNewItemTitle('')
                  setErrorMsg(null)
                }
              }}
              placeholder="Skriv inn tittel..."
              autoFocus
              style={{
                flex: 1,
                padding: 'var(--space-sm) var(--space-md)',
                border: '1px solid var(--color-neutral-300)',
                borderRadius: 'var(--border-radius-md)',
                fontSize: 'var(--font-size-base)',
              }}
            />
            <button
              onClick={handleAddItem}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Lagre
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewItemTitle('')
                setErrorMsg(null)
              }}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'var(--color-neutral-200)',
                color: 'var(--color-neutral-700)',
                border: 'none',
                borderRadius: 'var(--border-radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
            }}
          >
            {sortedItems.length === 0 ? (
              <p
                style={{
                  color: 'var(--color-neutral-500)',
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                Ingen {type} lagt til ennå
              </p>
            ) : (
              sortedItems.map((item) => (
                <SortableItemWrapper
                  key={item.id}
                  item={item}
                  teamMembers={teamMembers}
                  allRelations={allRelations}
                  userRole={userRole}
                  onRefetch={onRefetch}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
