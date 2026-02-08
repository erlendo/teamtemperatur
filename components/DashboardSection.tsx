'use client'

import {
  createItem,
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
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TeamItemCard } from './TeamItemCard'

type ItemType = 'ukemål' | 'pipeline' | 'mål' | 'retro'

// Nordic nature colors
const NORDIC_COLORS: Record<ItemType, { accent: string; light: string }> = {
  ukemål: { accent: '#6b7280', light: '#f3f4f6' }, // Fjell-grå
  pipeline: { accent: '#1a472a', light: '#f0fdf4' }, // Skog-grønn
  mål: { accent: '#0f766e', light: '#f0fdfa' }, // Fjord-blå
  retro: { accent: '#92400e', light: '#fefce8' }, // Antikk-brun
}

// Wrapper component to make TeamItemCard sortable
function SortableItemWrapper({
  item,
  teamMembers,
  onUpdate,
}: {
  item: TeamItem
  teamMembers: Array<{ id: string; email: string }>
  onUpdate: () => void
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TeamItemCard item={item} teamMembers={teamMembers} onUpdate={onUpdate} />
    </div>
  )
}

interface DashboardSectionProps {
  title: string
  type: ItemType
  items: TeamItem[]
  teamId: string
  teamMembers: Array<{ id: string; email: string }>
  onUpdate?: () => void
}

export function DashboardSection({
  title,
  type,
  items,
  teamId,
  teamMembers,
  onUpdate,
}: DashboardSectionProps) {
  const colors = NORDIC_COLORS[type]
  const [isAdding, setIsAdding] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sortedItems, setSortedItems] = useState<TeamItem[]>(
    [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  )
  const router = useRouter()

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
      try {
        const result = await createItem(teamId, type, newItemTitle.trim())
        if (result.error) {
          setErrorMsg(result.error)
          return
        }
        setNewItemTitle('')
        setIsAdding(false)
        setErrorMsg(null)
        router.refresh()
        onUpdate?.()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setErrorMsg(msg)
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

        router.refresh()
        onUpdate?.()
      }
    }
  }

  const handleUpdate = () => {
    router.refresh()
    onUpdate?.()
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
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
