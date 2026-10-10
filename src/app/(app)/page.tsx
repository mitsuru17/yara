import Link from "next/link";
import { Plus } from "lucide-react";
import { CityIllustration } from "@/components/city-illustration";
import { IncidentTable } from "@/components/incidents/incident-table";
import { IncidentsMap } from "@/components/map";
import { LiveRefresh } from "@/components/live-refresh";
import { createClient } from "@/lib/supabase/server";
import type { FeedIncident } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("incident_feed")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(30)
    .returns<FeedIncident[]>();
  const incidents = data ?? [];
  const active = incidents.filter((i) => i.status === "PUBLISHED");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">
      <LiveRefresh />
      <section className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Reporta inseguridad en tu distrito
          </h1>
          <p className="mt-5 text-lg text-muted">
            Tu reporte es anónimo y ayuda a crear un distrito más seguro.
          </p>
          <Link
            href="/reportar"
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-brand-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 sm:w-auto"
          >
            <Plus className="h-6 w-6" /> Nuevo Reporte
          </Link>
        </div>
        <CityIllustration className="hidden lg:block" />
      </section>

      <hr className="my-10 border-line" />

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">Reportes recientes</h2>
          <span className="text-sm text-muted">{active.length} alertas activas</span>
        </div>
        <IncidentTable rows={incidents.slice(0, 5)} empty="Aún no hay reportes en tu distrito." />
        <div className="mt-6 text-center">
          <Link
            href="/mapa"
            className="inline-flex rounded-xl border-2 border-brand-600/80 px-10 py-3 font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            Ver todos los reportes
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-5 text-2xl font-bold">Mapa de alertas</h2>
        <div className="h-[380px] overflow-hidden rounded-2xl border border-line">
          <IncidentsMap incidents={incidents} />
        </div>
      </section>
    </div>
  );
}
