"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellRing, Megaphone, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/format";

type Item = {
  id: number;
  read: boolean;
  created_at: string;
  alerts: { id: number; title: string; message: string; incident_id: number | null } | null;
};

export function NotificationBell({
  userId,
  initialUnread,
}: {
  userId: string;
  initialUnread: number;
}) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [toast, setToast] = useState<Item["alerts"]>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Suscripción en tiempo real a las notificaciones del usuario (Supabase Realtime).
  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (!active) return;

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            setUnread((n) => n + 1);
            setItems(null);
            const { data: alert } = await supabase
              .from("alerts")
              .select("id, title, message, incident_id")
              .eq("id", (payload.new as { alert_id: number }).alert_id)
              .single();
            if (alert) setToast(alert);
            router.refresh();
          },
        )
        .subscribe();
    })();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, userId, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items === null) {
      const { data } = await supabase
        .from("notifications")
        .select("id, read, created_at, alerts(id, title, message, incident_id)")
        .order("created_at", { ascending: false })
        .limit(15)
        .returns<Item[]>();
      setItems(data ?? []);
    }
  }

  async function markAllRead() {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    setUnread(0);
    setItems((list) => list?.map((i) => ({ ...i, read: true })) ?? null);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ""}`}
        className="relative rounded-full p-2 text-ink hover:bg-canvas"
      >
        <Bell className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold">Alertas</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items === null && <li className="p-4 text-sm text-muted">Cargando…</li>}
            {items?.length === 0 && (
              <li className="p-4 text-sm text-muted">No tienes alertas todavía.</li>
            )}
            {items?.map((n) => (
              <li key={n.id} className={n.read ? "" : "bg-brand-50/60"}>
                <Link
                  href={n.alerts?.incident_id ? `/reportes/${n.alerts.incident_id}` : "/mapa"}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 border-b border-line px-4 py-3 hover:bg-canvas"
                >
                  {n.alerts?.incident_id ? (
                    <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  ) : (
                    <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{n.alerts?.title}</p>
                    <p className="line-clamp-2 text-sm text-muted">{n.alerts?.message}</p>
                    <p className="mt-1 text-xs text-muted">{timeAgo(n.created_at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {toast &&
        createPortal(
        <div
          role="status"
          className="fixed bottom-24 right-4 z-[1100] w-[min(92vw,380px)] rounded-2xl border border-brand-100 bg-white p-4 shadow-2xl lg:bottom-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <BellRing className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Nueva alerta
              </p>
              <p className="font-semibold">{toast.title}</p>
              <p className="line-clamp-2 text-sm text-muted">{toast.message}</p>
              {toast.incident_id && (
                <Link
                  href={`/reportes/${toast.incident_id}`}
                  onClick={() => setToast(null)}
                  className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline"
                >
                  Ver reporte
                </Link>
              )}
            </div>
            <button onClick={() => setToast(null)} aria-label="Cerrar" className="text-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}
