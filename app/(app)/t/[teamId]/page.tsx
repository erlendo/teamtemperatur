import Link from "next/link";

export default async function TeamHome({ params }: { params: { teamId: string } }) {
  const { teamId } = params;
  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Team</h1>
      <ul>
        <li><Link href={`/t/${teamId}/survey`}>Ny måling</Link></li>
        <li><Link href={`/t/${teamId}/stats`}>Statistikk</Link></li>
      </ul>
      <p><Link href="/teams">← Til teams</Link></p>
    </div>
  );
}
