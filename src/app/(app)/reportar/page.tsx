import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportForm } from "./report-form";
import { getSession } from "@/lib/session";
import type { IncidentType } from "@/lib/types";

export const metadata: Metadata = { title: "Nuevo reporte" };

export default async function ReportPage() {
  const { supabase, profile } = await getSession();
  if (!profile) redirect("/login?next=/reportar");

  const { data: types } = await supabase
    .from("incident_types")
    .select("*")
    .order("id")
    .returns<IncidentType[]>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Nuevo Reporte</h1>
      <p className="mt-2 text-muted">
        Completa la información para enviar tu reporte de inseguridad ciudadana.
      </p>
      <ReportForm types={types ?? []} userId={profile.id} />
    </div>
  );
}
