"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { CheckCircle2, EyeOff, Loader2, Megaphone, RotateCcw } from "lucide-react";
import { sendAnnouncement, setIncidentStatus, setUserStatus } from "@/lib/actions/admin";
import { Field, FormMessage, SubmitButton, inputClass } from "@/components/form-fields";
import type { IncidentStatus } from "@/lib/types";

export function AnnouncementForm() {
  const [state, action] = useActionState(sendAnnouncement, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="mt-4 space-y-3">
      <Field label="Título">
        <input name="title" maxLength={150} required className={inputClass} placeholder="Ej.: Patrullaje reforzado en Ciudad de Dios" />
      </Field>
      <Field label="Mensaje">
        <textarea name="message" rows={3} maxLength={1000} required className={`${inputClass} resize-none`} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="sm:w-auto"><Megaphone className="h-5 w-5" /> Enviar comunicado</SubmitButton>
    </form>
  );
}

export function RowActions({ incidentId, status }: { incidentId: number; status: IncidentStatus }) {
  const [pending, start] = useTransition();
  const btn = "rounded-lg p-2 hover:bg-canvas disabled:opacity-40";
  if (pending) return <Loader2 className="h-5 w-5 animate-spin text-muted" />;
  return (
    <div className="flex gap-1">
      {status !== "CLOSED" && (
        <button title="Marcar atendido" aria-label="Marcar atendido" className={`${btn} text-green-600`} onClick={() => start(() => setIncidentStatus(incidentId, "CLOSED"))}>
          <CheckCircle2 className="h-5 w-5" />
        </button>
      )}
      {status !== "PUBLISHED" && (
        <button title="Publicar / reabrir" aria-label="Publicar o reabrir" className={`${btn} text-brand-600`} onClick={() => start(() => setIncidentStatus(incidentId, "PUBLISHED"))}>
          <RotateCcw className="h-5 w-5" />
        </button>
      )}
      {status !== "HIDDEN" && (
        <button title="Ocultar" aria-label="Ocultar" className={`${btn} text-red-600`} onClick={() => start(() => setIncidentStatus(incidentId, "HIDDEN"))}>
          <EyeOff className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function UserStatusToggle({ userId, status }: { userId: string; status: "ACTIVE" | "INACTIVE" }) {
  const [pending, start] = useTransition();
  const active = status === "ACTIVE";
  return (
    <button
      disabled={pending}
      onClick={() => start(() => setUserStatus(userId, active ? "INACTIVE" : "ACTIVE"))}
      className={`rounded-md px-3 py-1 text-sm font-medium disabled:opacity-50 ${active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
    >
      {pending ? "…" : active ? "Activo" : "Inactivo"}
    </button>
  );
}
