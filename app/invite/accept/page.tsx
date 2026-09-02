import { acceptTeamInvitation } from '@/server/actions/teams'
import { redirect } from 'next/navigation'

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    redirect('/login?error=ugyldig_invitasjon')
  }

  const encodedInvitePath = encodeURIComponent(`/invite/accept?token=${token}`)

  const result = await acceptTeamInvitation(token)

  if (result.error === 'Ikke autentisert') {
    redirect(`/login?redirect=${encodedInvitePath}`)
  }

  if (result.error) {
    const errorCode = result.error.includes('utløpt')
      ? 'invitasjon_utgaatt'
      : result.error.includes('e-post')
        ? 'invitasjon_feil_e-post'
        : 'invitasjon_ikke_funnet'
    redirect(`/teams?error=${errorCode}`)
  }

  redirect(`/t/${result.teamId}`)
}
