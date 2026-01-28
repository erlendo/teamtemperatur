import { getUsersWithSubmissions } from '@/server/actions/teams'
import { redirect } from 'next/navigation'
import AdminUsersWithSubmissions from './client'

export const dynamic = 'force-dynamic'

export default async function AdminPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params

  const result = await getUsersWithSubmissions(teamId)

  if (result.error) {
    // Not authorized or other error
    redirect(`/t/${teamId}`)
  }

  return (
    <div>
      <div
        style={{
          borderBottom: '1px solid #e0e0e0',
          padding: '1.5rem 2rem',
          backgroundColor: '#fff',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>
          Team Admin
        </h1>
      </div>
      <AdminUsersWithSubmissions teamId={teamId} initialUsers={result.data} />
    </div>
  )
}
