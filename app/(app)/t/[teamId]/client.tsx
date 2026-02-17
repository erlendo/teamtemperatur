'use client'

import { DashboardGrid } from '@/components/DashboardGrid'
import { DashboardSection } from '@/components/DashboardSection'
import { RelationGuide } from '@/components/RelationGuide'
import { RelationToggle } from '@/components/RelationToggle'
import {
  getAllTeamRelations,
  getTeamItems,
  type ItemRelation,
  type TeamItem,
} from '@/server/actions/dashboard'
import { useState } from 'react'

interface DashboardClientProps {
  ukemålItems: TeamItem[]
  pipelineItems: TeamItem[]
  målItems: TeamItem[]
  retroItems: TeamItem[]
  allRelations: ItemRelation[]
  teamId: string
  teamMembers: Array<{ id: string; firstName: string }>
  userRole: string
}

export function DashboardClient({
  ukemålItems: initialUkemålItems,
  pipelineItems: initialPipelineItems,
  målItems: initialMålItems,
  retroItems: initialRetroItems,
  allRelations: initialAllRelations,
  teamId,
  teamMembers,
  userRole,
}: DashboardClientProps) {
  // State for all items
  const [ukemålItems, setUkemålItems] = useState(initialUkemålItems)
  const [pipelineItems, setPipelineItems] = useState(initialPipelineItems)
  const [målItems, setMålItems] = useState(initialMålItems)
  const [retroItems, setRetroItems] = useState(initialRetroItems)

  // State for all relations (batch fetched)
  const [allRelations, setAllRelations] = useState(initialAllRelations)

  // Optimistic add - immediately show new item in UI
  const handleOptimisticAdd = (item: TeamItem) => {
    if (item.type === 'ukemål') {
      setUkemålItems((prev) => [...prev, item])
    } else if (item.type === 'pipeline') {
      setPipelineItems((prev) => [...prev, item])
    } else if (item.type === 'mål') {
      setMålItems((prev) => [...prev, item])
    } else if (item.type === 'retro') {
      setRetroItems((prev) => [...prev, item])
    }
  }

  // Optimistic remove - remove item by ID (used on error)
  const handleOptimisticRemove = (itemId: string) => {
    setUkemålItems((prev) => prev.filter((i) => i.id !== itemId))
    setPipelineItems((prev) => prev.filter((i) => i.id !== itemId))
    setMålItems((prev) => prev.filter((i) => i.id !== itemId))
    setRetroItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  // Optimistic replace - replace temp ID with real ID from server
  const handleOptimisticReplace = (tempId: string, realId: string) => {
    const replaceInArray = (items: TeamItem[]) =>
      items.map((item) => (item.id === tempId ? { ...item, id: realId } : item))

    setUkemålItems(replaceInArray)
    setPipelineItems(replaceInArray)
    setMålItems(replaceInArray)
    setRetroItems(replaceInArray)
  }

  // Refetch items from server (for updates, deletes, etc.)
  const handleRefetchItems = async () => {
    const { items } = await getTeamItems(teamId)
    setUkemålItems(items.filter((i) => i.type === 'ukemål'))
    setPipelineItems(items.filter((i) => i.type === 'pipeline'))
    setMålItems(items.filter((i) => i.type === 'mål'))
    setRetroItems(items.filter((i) => i.type === 'retro'))

    // Also refetch relations
    const { relations } = await getAllTeamRelations(teamId)
    setAllRelations(relations)
  }

  return (
    <>
      <DashboardGrid
        ukemålItems={ukemålItems}
        pipelineItems={pipelineItems}
        målItems={målItems}
        allRelations={allRelations}
        teamId={teamId}
        teamMembers={teamMembers}
        userRole={userRole}
        onOptimisticAdd={handleOptimisticAdd}
        onOptimisticRemove={handleOptimisticRemove}
        onOptimisticReplace={handleOptimisticReplace}
        onRefetch={handleRefetchItems}
      />

      {/* Retro section */}
      <div style={{ marginBottom: 'var(--space-2xl)', marginTop: 'var(--space-2xl)' }}>
        <DashboardSection
          title="Retro-forbedringer"
          type="retro"
          items={retroItems}
          allRelations={allRelations}
          teamId={teamId}
          teamMembers={teamMembers}
          userRole={userRole}
          onOptimisticAdd={handleOptimisticAdd}
          onOptimisticRemove={handleOptimisticRemove}
          onOptimisticReplace={handleOptimisticReplace}
          onRefetch={handleRefetchItems}
        />
      </div>

      <RelationToggle />
      <RelationGuide />
    </>
  )
}
