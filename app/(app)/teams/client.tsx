'use client'

import Link from 'next/link'
import { useTransition, useState } from 'react'
import { createTeam } from '@/server/actions/teams'

interface TeamsListProps {
  teams: Array<{ id: string; name: string; role: string }>
}

export function TeamsList({ teams }: TeamsListProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCreateTeam(formData: FormData) {
    const name = String(formData.get('name') || '').trim()
    if (!name) return

    setError(null)

    startTransition(async () => {
      const result = await createTeam(name)

      if ('error' in result) {
        setError(result.error)
      } else {
        // Clear form and refetch
        ;(document.querySelector('input[name="name"]') as HTMLInputElement).value = ''
      }
    })
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Teams</h1>

      <form action={handleCreateTeam} style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <input name="name" placeholder="Nytt teamnavn" style={{ flex: 1, padding: 10 }} disabled={isPending} />
        <button style={{ padding: '10px 14px' }} disabled={isPending}>
          {isPending ? 'Opprett...' : 'Opprett'}
        </button>
      </form>

      {error && <p style={{ color: '#e00', marginBottom: 12 }}>{error}</p>}

      <ul style={{ paddingLeft: 16 }}>
        {teams.map((t) => (
          <li key={t.id} style={{ marginBottom: 8 }}>
            <Link href={`/t/${t.id}`}>{t.name}</Link> <span style={{ color: '#666' }}>({t.role})</span>
          </li>
        ))}
      </ul>

      <form action="/logout" method="post" style={{ marginTop: 18 }}>
        <button style={{ padding: '8px 12px' }}>Logg ut</button>
      </form>
    </div>
  )
}
