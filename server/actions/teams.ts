"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function listMyTeams() {
  const supabase = supabaseServer();
  const { data: u, error: authError } = await supabase.auth.getUser();
  
  if (authError || !u.user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("team_memberships")
    .select("team_id, role, teams:team_id(id, name)")
    .eq("user_id", u.user.id)
    .eq("status", "active");

  if (error) {
    console.error("listMyTeams error:", error);
    return [];
  }

  return (data ?? []).map((r: any) => ({
    id: r.teams.id as string,
    name: r.teams.name as string,
    role: r.role as string,
  }));
}

export async function createTeam(name: string) {
  const supabase = supabaseServer();
  const { data: u, error: authError } = await supabase.auth.getUser();
  
  if (authError || !u.user) {
    redirect("/login");
  }

  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .insert({ name, created_by: u.user.id, settings: { teamSize: 6 } })
    .select()
    .single();
  if (teamErr) {
    console.error("createTeam error:", teamErr);
    throw teamErr;
  }

  const { error: memErr } = await supabase
    .from("team_memberships")
    .insert({ team_id: team.id, user_id: u.user.id, role: "owner", status: "active" });
  if (memErr) {
    console.error("createTeam membership error:", memErr);
    throw memErr;
  }

  return team;
}
