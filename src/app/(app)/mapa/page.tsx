import type { Metadata } from "next";
import Link from "next/link";
import { IncidentTable } from "@/components/incidents/incident-table";
import { IncidentsMap } from "@/components/map";
import { LiveRefresh } from "@/components/live-refresh";
import { createClient } from "@/lib/supabase/server";
import { daysAgoIso } from "@/lib/format";
import type { FeedIncident, IncidentType } from "@/lib/types";

export const metadata: Metadata = { title: "Mapa de alertas" };

const PERIODS = { "24h": 1, "7d": 7, "30d": 30, todo: null } as const;
const PERIOD_LABEL: Record<keyof typeof PERIODS, string> = {
  "24h": "Últimas 24 h",
  "7d": "7 días",
  "30d": "30 días",
  todo: "Todo",
};
const STATES = { activos: ["PUBLISHED"], atendidos: ["CLOSED"], todos: ["PUBLISHED", "CLOSED"] } as const;
const STATE_LABEL: Record<keyof typeof STATES, string> = {
  activos: "En proceso",
  atendidos: "Atendidos",
  todos: "Todos",
};

function pick<T extends object>(obj: T, value: unknown, fallback: keyof T): keyof T {
  return typeof value === "string" && value in obj ? (value as keyof T) : fallback;
}

export default async function MapPage({ searchParams }: PageProps<"/mapa">) {
  const sp = await searchParams;
  const periodo = pick(PERIODS, sp.periodo, "30d");
  const estado = pick(STATES, sp.estado, "todos");
  const tipo = Number(sp.tipo) || null;

  const supabase = await createClient();
  let query = supabase
    .from("incident_feed")
    .select("*")
    .in("status", [...STATES[estado]])
    .order("occurred_at", { ascending: false })
    .limit(200);
  const days = PERIODS[periodo];
  if (days) query = query.gte("occurred_at", daysAgoIso(days));
  if (tipo) query = query.eq("incident_type_id", tipo);

  const [{ data }, { data: types }] = await Promise.all([
    query.returns<FeedIncident[]>(),
    supabase.from("incident_types").select("*").order("id").returns<IncidentType[]>(),
  ]);
  const incidents = data ?? [];

  const href = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const merged = { periodo, estado, tipo: tipo ? String(tipo) : null, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, String(v));
    return `/mapa?${params}`;
  };
  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
      active ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white hover:border-brand-500"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
      <LiveRefresh />
      <h1 className="text-3xl font-bold sm:text-4xl">Mapa de alertas</h1>
      <p className="mt-2 text-muted">
        Incidentes reportados por la comunidad. Los reportes son referenciales y no constituyen
        denuncias oficiales.
      </p>

      <div className="mt-6 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(PERIODS) as (keyof typeof PERIODS)[]).map((p) => (
            <Link key={p} href={href({ periodo: p })} className={chip(p === periodo)}>
              {PERIOD_LABEL[p]}
            </Link>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          {(Object.keys(STATES) as (keyof typeof STATES)[]).map((s) => (
            <Link key={s} href={href({ estado: s })} className={chip(s === estado)}>
              {STATE_LABEL[s]}
            </Link>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link href={href({ tipo: null })} className={chip(!tipo)}>
            Todos los tipos
          </Link>
          {types?.map((t) => (
            <Link key={t.id} href={href({ tipo: String(t.id) })} className={chip(tipo === t.id)}>
              <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 h-[420px] overflow-hidden rounded-2xl border border-line lg:h-[520px]">
        <IncidentsMap incidents={incidents} />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold">
          {incidents.length} {incidents.length === 1 ? "reporte" : "reportes"}
        </h2>
        <IncidentTable rows={incidents} withThumbs withActions empty="No hay reportes con estos filtros." />
      </div>
    </div>
  );
}
