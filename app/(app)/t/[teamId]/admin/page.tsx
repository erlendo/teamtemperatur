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

  try {
    const result = await getUsersWithSubmissions(teamId)

    if (result.error) {
      // Not authorized or other error
      console.error('[AdminPage] Error:', result.error)
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
        <AdminUsersWithSubmissions teamId={teamId} initialUsers={result.data ?? []} />
      </div>
    )
  } catch (error) {
    console.error('[AdminPage] Unexpected error:', error)
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ color: '#d32f2f' }}>Feil</h1>
        <p>Kunne ikke laste admin-siden. Sjekk at:</p>
        <ul>
          <li>Du er eier av teamet</li>
          <li>Alle database-migrasjoner er kjørt</li>
        </ul>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>
          Feil: {error instanceof Error ? error.message : 'Ukjent feil'}
        </p>
      </div>
    )
  }
}
