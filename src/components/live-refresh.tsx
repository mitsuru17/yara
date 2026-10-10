"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Refresca la vista cuando se publica una nueva alerta (Supabase Realtime). */
export function LiveRefresh() {
  const router = useRouter();
  const [supabase] = useState(createClient);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session || !active) return; // las alertas solo son visibles para usuarios autenticados
      await supabase.realtime.setAuth(data.session.access_token);
      channel = supabase
        .channel("alerts-feed")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, () =>
          router.refresh(),
        )
        .subscribe();
    })();
    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  return null;
}
