import { listMyTeams } from '@/server/actions/teams'
import { redirect } from 'next/navigation'
import { TeamsList } from './client'

export default async function TeamsPage() {
  const teams = await listMyTeams()

  // If not authenticated, redirect to login
  if (teams === null) {
    redirect('/login')
  }

  return <TeamsList teams={teams} />
}
