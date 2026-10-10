import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** Usuario autenticado + perfil, memoizado por request. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { supabase, profile: null as Profile | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<Profile>();

  return { supabase, profile };
});
