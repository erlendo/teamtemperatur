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
