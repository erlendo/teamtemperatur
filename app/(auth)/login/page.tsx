"use client";

import { useState } from "react";
import { sendMagicLink } from "@/server/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const result = await sendMagicLink(email);

    if ("error" in result) {
      setMsg(`Feil: ${result.error}`);
    } else {
      setMsg("Sjekk e-post for innloggingslenke.");
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h1>Logg inn</h1>
      <form onSubmit={handleSubmit}>
        <label>E-post</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          type="email"
          required
        />
        <button style={{ marginTop: 12, padding: "10px 14px" }}>
          Send innloggingslenke
        </button>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
