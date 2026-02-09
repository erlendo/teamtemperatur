'use client'

import {
  createItem,
  createRelation,
  reorderItem,
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
import { useState } from 'react'
import { TeamItemCard } from './TeamItemCard'

type ItemType = 'ukemål' | 'pipeline' | 'mål' | 'retro'

interface DashboardGridProps {
  ukemålItems: TeamItem[]
  pipelineItems: TeamItem[]
  målItems: TeamItem[]
  teamId: string
  teamMembers: Array<{ id: string; firstName: string }>
  userRole: string
  onUpdate?: () => void
}

const NORDIC_COLORS: Record<ItemType, { accent: string; light: string }> = {
  ukemål: { accent: '#6b7280', light: '#f3f4f6' },
  pipeline: { accent: '#1a472a', light: '#f0fdf4' },
  mål: { accent: '#0f766e', light: '#f0fdfa' },
  retro: { accent: '#92400e', light: '#fefce8' },
}

function SortableItemWrapper({
  item,
  teamMembers,
  onUpdate,
  userRole,
}: {
  item: TeamItem
  teamMembers: Array<{ id: string; firstName: string }>
  onUpdate: () => void
  userRole: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { type: item.type } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TeamItemCard
        item={item}
        teamMembers={teamMembers}
        onUpdate={onUpdate}
        userRole={userRole}
      />
    </div>
  )
}

function GridSection({
  title,
  type,
  items,
  teamId,
  teamMembers,
  userRole,
  onUpdate,
}: {
  title: string
  type: ItemType
  items: TeamItem[]
  teamId: string
  teamMembers: Array<{ id: string; firstName: string }>
  userRole: string
  onUpdate?: () => void
}) {
  const colors = NORDIC_COLORS[type]
  const [isAdding, setIsAdding] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleAddItem = async () => {
    if (newItemTitle.trim()) {
      try {
        const result = await createItem(teamId, type, newItemTitle.trim())
        if (result.error) {
          setErrorMsg(result.error)
          return
        }
        setNewItemTitle('')
        setIsAdding(false)
        setErrorMsg(null)
        onUpdate?.()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setErrorMsg(msg)
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

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'var(--color-primary, #3b82f6)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
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
                color: 'var(--color-error, #ef4444)',
                fontSize: 'var(--font-size-sm)',
                margin: 0,
                padding: 'var(--space-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              ❌ {errorMsg}
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
                if (e.key === 'Enter') void handleAddItem()
                if (e.key === 'Escape') {
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
                borderRadius: 'var(--radius-md)',
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
                borderRadius: 'var(--radius-md)',
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
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
          }}
        >
          {items.length === 0 ? (
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
            items.map((item) => (
              <SortableItemWrapper
                key={item.id}
                item={item}
                teamMembers={teamMembers}
                userRole={userRole}
                onUpdate={() => onUpdate?.()}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function DashboardGrid({
  ukemålItems,
  pipelineItems,
  målItems,
  teamId,
  teamMembers,
  userRole,
  onUpdate,
}: DashboardGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // Determine which section the items belong to
    const activeItem = [...ukemålItems, ...pipelineItems, ...målItems].find(
      (item) => item.id === activeId
    )
    const overItem = [...ukemålItems, ...pipelineItems, ...målItems].find(
      (item) => item.id === overId
    )

    if (!activeItem || !overItem) return

    // Check if this is a cross-column drag
    if (activeItem.type !== overItem.type) {
      console.log('Cross-column drag detected:', {
        from: activeItem.type,
        to: overItem.type,
      })

      // Validate relation type based on source and target types
      let relationType: 'next_step' | 'part_of' | null = null

      if (activeItem.type === 'ukemål' && overItem.type === 'pipeline') {
        relationType = 'next_step'
      } else if (activeItem.type === 'pipeline' && overItem.type === 'mål') {
        relationType = 'part_of'
      } else if (activeItem.type === 'pipeline' && overItem.type === 'ukemål') {
        // Reverse: pipeline → ukemål (still next_step but flipped)
        relationType = 'next_step'
      } else if (activeItem.type === 'mål' && overItem.type === 'pipeline') {
        // Reverse: mål → pipeline (part_of but flipped)
        relationType = 'part_of'
      }

      if (relationType) {
        // Determine source and target based on relation type
        let sourceId = activeId
        let targetId = overId

        // Ensure correct direction for constraints
        if (relationType === 'next_step' && activeItem.type === 'pipeline') {
          // Flip: if user dragged pipeline to ukemål, swap them
          sourceId = overId
          targetId = activeId
        } else if (relationType === 'part_of' && activeItem.type === 'mål') {
          // Flip: if user dragged mål to pipeline, swap them
          sourceId = overId
          targetId = activeId
        }

        const result = await createRelation(
          teamId,
          sourceId,
          targetId,
          relationType
        )

        if (result.error) {
          console.error('Failed to create relation:', result.error)
          alert(`Feil: ${result.error}`)
        } else {
          console.log('Relation created successfully')
          onUpdate?.()
        }
      }
      return
    }

    // Same column: handle reordering
    let itemsToReorder: TeamItem[] = []
    if (activeItem.type === 'ukemål') {
      itemsToReorder = ukemålItems
    } else if (activeItem.type === 'pipeline') {
      itemsToReorder = pipelineItems
    } else if (activeItem.type === 'mål') {
      itemsToReorder = målItems
    }

    const oldIndex = itemsToReorder.findIndex((item) => item.id === activeId)
    const newIndex = itemsToReorder.findIndex((item) => item.id === overId)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(itemsToReorder, oldIndex, newIndex)

      // Update sort_order for reordered items
      for (let i = 0; i < newOrder.length; i++) {
        const item = newOrder[i]
        if (item && (item.sort_order || 0) !== i) {
          await reorderItem(item.id, i, teamId)
        }
      }

      onUpdate?.()
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 'var(--space-2xl)',
          marginBottom: 'var(--space-2xl)',
        }}
      >
        <GridSection
          title="Ukemål denne uka"
          type="ukemål"
          items={ukemålItems}
          teamId={teamId}
          teamMembers={teamMembers}
          userRole={userRole}
          onUpdate={onUpdate}
        />
        <GridSection
          title="Pipeline"
          type="pipeline"
          items={pipelineItems}
          teamId={teamId}
          teamMembers={teamMembers}
          userRole={userRole}
          onUpdate={onUpdate}
        />
        <GridSection
          title={`Mål (T${Math.ceil((new Date().getMonth() + 1) / 4)} ${new Date().getFullYear()})`}
          type="mål"
          items={målItems}
          teamId={teamId}
          teamMembers={teamMembers}
          userRole={userRole}
          onUpdate={onUpdate}
        />
      </div>
    </DndContext>
  )
}
