'use client'

import { DashboardGrid } from '@/components/DashboardGrid'
import { RelationGuide } from '@/components/RelationGuide'
import { RelationToggle } from '@/components/RelationToggle'
import type { TeamItem } from '@/server/actions/dashboard'
import { useRouter } from 'next/navigation'

interface DashboardClientProps {
  ukemålItems: TeamItem[]
  pipelineItems: TeamItem[]
  målItems: TeamItem[]
  teamId: string
  teamMembers: Array<{ id: string; firstName: string }>
  userRole: string
}

export function DashboardClient({
  ukemålItems,
  pipelineItems,
  målItems,
  teamId,
  teamMembers,
  userRole,
}: DashboardClientProps) {
  const router = useRouter()

  const handleUpdate = () => {
    router.refresh()
  }

  return (
    <>
      <DashboardGrid
        ukemålItems={ukemålItems}
        pipelineItems={pipelineItems}
        målItems={målItems}
        teamId={teamId}
        teamMembers={teamMembers}
        userRole={userRole}
        onUpdate={handleUpdate}
      />
      <RelationToggle />
      <RelationGuide />
    </>
  )
}
