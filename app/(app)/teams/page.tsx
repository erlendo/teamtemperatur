import Link from "next/link";
import { listMyTeams, createTeam } from "@/server/actions/teams";

export default async function TeamsPage() {
  const teams = await listMyTeams();

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Teams</h1>

      <form
        action={async (formData) => {
          "use server";
          const name = String(formData.get("name") || "").trim();
          if (name) await createTeam(name);
        }}
        style={{ display: "flex", gap: 8, marginBottom: 18 }}
      >
        <input name="name" placeholder="Nytt teamnavn" style={{ flex: 1, padding: 10 }} />
        <button style={{ padding: "10px 14px" }}>Opprett</button>
      </form>

      <ul style={{ paddingLeft: 16 }}>
        {teams.map((t) => (
          <li key={t.id} style={{ marginBottom: 8 }}>
            <Link href={`/t/${t.id}`}>{t.name}</Link> <span style={{ color: "#666" }}>({t.role})</span>
          </li>
        ))}
      </ul>

      <form action="/logout" method="post" style={{ marginTop: 18 }}>
        <button style={{ padding: "8px 12px" }}>Logg ut</button>
      </form>
    </div>
  );
}
