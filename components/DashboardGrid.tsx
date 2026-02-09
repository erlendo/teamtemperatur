'use client'

import {
  createItem,
  createRelation,
  getAllTeamRelations,
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
import { forwardRef, useEffect, useRef, useState } from 'react'
import { RelationConnectors } from './RelationConnectors'
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

function SortableItemWrapper(
  {
    item,
    teamMembers,
    onUpdate,
    userRole,
    onHover,
    onRelationDelete,
  }: {
    item: TeamItem
    teamMembers: Array<{ id: string; firstName: string }>
    onUpdate: () => void
    userRole: string
    onHover?: (itemId: string | null) => void
    onRelationDelete?: (relationId: string) => void
  },
  _ref: React.Ref<HTMLDivElement>
) {
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
    <div
      ref={setNodeRef}
      data-item-id={item.id}
      style={style}
      {...attributes}
      {...listeners}
      onMouseEnter={() => onHover?.(item.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <TeamItemCard
        item={item}
        teamMembers={teamMembers}
        onUpdate={onUpdate}
        userRole={userRole}
        onRelationDelete={onRelationDelete}
      />
    </div>
  )
}

const SortableItemWrapperForward = forwardRef(SortableItemWrapper)

function GridSection({
  title,
  type,
  items,
  teamId,
  teamMembers,
  userRole,
  onUpdate,
  onHover,
  onRelationDelete,
}: {
  title: string
  type: ItemType
  items: TeamItem[]
  teamId: string
  teamMembers: Array<{ id: string; firstName: string }>
  userRole: string
  onUpdate?: () => void
  onHover?: (itemId: string | null) => void
  onRelationDelete?: (relationId: string) => void
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
              <SortableItemWrapperForward
                key={item.id}
                item={item}
                teamMembers={teamMembers}
                userRole={userRole}
                onUpdate={() => onUpdate?.()}
                onHover={onHover}
                onRelationDelete={onRelationDelete}
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

  // State for tracking card positions and relations
  const [itemPositions, setItemPositions] = useState(
    new Map<
      string,
      { id: string; x: number; y: number; width: number; height: number }
    >()
  )
  const [allRelations, setAllRelations] = useState<ItemRelation[]>([])
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null
  )
  const containerRef = useRef<HTMLDivElement>(null)

  const allItems = useRef([...ukemålItems, ...pipelineItems, ...målItems])
  allItems.current = [...ukemålItems, ...pipelineItems, ...målItems]

  // Fetch all relations for the team (batch query)
  useEffect(() => {
    const fetchAllRelations = async () => {
      const result = await getAllTeamRelations(teamId)
      if (!result.error) {
        setAllRelations(result.relations)
      }
    }

    void fetchAllRelations()
  }, [teamId])

  // Optimistic delete handler - removes relation from state immediately
  const handleRelationDelete = (relationId: string) => {
    setAllRelations((prev) => prev.filter((r) => r.id !== relationId))
    onUpdate?.()
  }

  // Update card positions from DOM query selector
  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current) return

      const positions = new Map<
        string,
        { id: string; x: number; y: number; width: number; height: number }
      >()
      const containerRect = containerRef.current.getBoundingClientRect()

      // Query all cards in the container
      const cardElements =
        containerRef.current.querySelectorAll('[data-item-id]')

      cardElements.forEach((element) => {
        const itemId = element.getAttribute('data-item-id')
        if (itemId) {
          const rect = element.getBoundingClientRect()
          positions.set(itemId, {
            id: itemId,
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
          })
        }
      })

      setItemPositions(positions)
    }

    // Initial update
    updatePositions()

    // Update on window resize and scroll
    const timer = setTimeout(updatePositions, 100)
    window.addEventListener('resize', updatePositions)
    window.addEventListener('scroll', updatePositions)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePositions)
      window.removeEventListener('scroll', updatePositions)
    }
  }, [])

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
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 'var(--space-2xl)',
          marginBottom: 'var(--space-2xl)',
        }}
      >
        <RelationConnectors
          relations={allRelations}
          itemPositions={itemPositions}
          highlightedItemId={highlightedItemId}
        />

        <GridSection
          title="Ukemål denne uka"
          type="ukemål"
          items={ukemålItems}
          teamId={teamId}
          teamMembers={teamMembers}
          userRole={userRole}
          onUpdate={onUpdate}
          onHover={setHighlightedItemId}
          onRelationDelete={handleRelationDelete}
        />
        <GridSection
          title="Pipeline"
          type="pipeline"
          items={pipelineItems}
          teamId={teamId}
          teamMembers={teamMembers}
          userRole={userRole}
          onUpdate={onUpdate}
          onHover={setHighlightedItemId}
          onRelationDelete={handleRelationDelete}
        />
        <GridSection
          title={`Mål (T${Math.ceil((new Date().getMonth() + 1) / 4)} ${new Date().getFullYear()})`}
          type="mål"
          items={målItems}
          teamId={teamId}
          teamMembers={teamMembers}
          userRole={userRole}
          onUpdate={onUpdate}
          onHover={setHighlightedItemId}
          onRelationDelete={handleRelationDelete}
        />
      </div>
    </DndContext>
  )
}
