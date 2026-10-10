"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, EyeOff, Loader2, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { deleteIncident, setIncidentStatus } from "@/lib/actions/admin";
import type { IncidentStatus } from "@/lib/types";

export function AdminIncidentActions({ incidentId, status }: { incidentId: number; status: IncidentStatus }) {
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const btn = "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-50";

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
        <ShieldCheck className="h-4 w-4" /> Moderación (administrador)
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      </p>
      <div className="flex flex-wrap gap-2">
        {status !== "CLOSED" && (
          <button disabled={pending} onClick={() => start(() => setIncidentStatus(incidentId, "CLOSED"))} className={`${btn} border-green-300 bg-white text-green-700 hover:bg-green-50`}>
            <CheckCircle2 className="h-4 w-4" /> Marcar atendido
          </button>
        )}
        {status !== "PUBLISHED" && (
          <button disabled={pending} onClick={() => start(() => setIncidentStatus(incidentId, "PUBLISHED"))} className={`${btn} border-line bg-white hover:bg-canvas`}>
            <RotateCcw className="h-4 w-4" /> {status === "HIDDEN" ? "Volver a publicar" : "Reabrir"}
          </button>
        )}
        {status !== "HIDDEN" && (
          <button disabled={pending} onClick={() => start(() => setIncidentStatus(incidentId, "HIDDEN"))} className={`${btn} border-line bg-white hover:bg-canvas`}>
            <EyeOff className="h-4 w-4" /> Ocultar (inapropiado)
          </button>
        )}
        {confirmDelete ? (
          <button disabled={pending} onClick={() => start(() => deleteIncident(incidentId))} className={`${btn} border-red-600 bg-red-600 text-white hover:bg-red-700`}>
            <Trash2 className="h-4 w-4" /> Confirmar eliminación
          </button>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className={`${btn} border-red-200 bg-white text-red-700 hover:bg-red-50`}>
            <Trash2 className="h-4 w-4" /> Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
