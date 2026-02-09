"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function sendMagicLink(email: string) {
  const supabase = supabaseServer();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/teams`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function saveUserProfile(
  firstName: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = supabaseServer();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Bruker ikke innlogget" };
    }

    const { error: insertError } = await supabase
      .from("user_profiles")
      .insert({
        user_id: user.id,
        first_name: firstName,
      });

    if (insertError) {
      return { error: insertError.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return { error: message };
  }
}