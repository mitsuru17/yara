import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { IncidentTable, type IncidentRow } from "@/components/incidents/incident-table";
import { Pagination } from "@/components/pagination";
import { Tabs } from "@/components/tabs";
import { getSession } from "@/lib/session";
import type { IncidentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Mis reportes" };

const PAGE_SIZE = 5;
const FILTERS: Record<string, { label: string; statuses: IncidentStatus[] }> = {
  todos: { label: "Todos", statuses: ["PENDING", "PUBLISHED", "CLOSED", "HIDDEN"] },
  "en-proceso": { label: "En proceso", statuses: ["PENDING", "PUBLISHED"] },
  atendidos: { label: "Atendidos", statuses: ["CLOSED"] },
};

type Row = {
  id: number;
  address: string;
  occurred_at: string;
  status: IncidentStatus;
  incident_types: { name: string; icon: string; color: string };
  incident_files: { file_url: string }[];
};

export default async function MyReportsPage({ searchParams }: PageProps<"/mis-reportes">) {
  const { supabase, profile } = await getSession();
  if (!profile) redirect("/login?next=/mis-reportes");

  const sp = await searchParams;
  const estado = typeof sp.estado === "string" && sp.estado in FILTERS ? sp.estado : "todos";
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data, count } = await supabase
    .from("incidents")
    .select(
      "id, address, occurred_at, status, incident_types(name, icon, color), incident_files(file_url)",
      { count: "exact" },
    )
    .eq("user_id", profile.id)
    .in("status", FILTERS[estado].statuses)
    .order("occurred_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
    .returns<Row[]>();

  const rows: IncidentRow[] = (data ?? []).map((r) => ({
    id: r.id,
    address: r.address,
    occurred_at: r.occurred_at,
    status: r.status,
    type_name: r.incident_types.name,
    type_icon: r.incident_types.icon,
    type_color: r.incident_types.color,
    cover_url: r.incident_files[0]?.file_url ?? null,
  }));
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold sm:text-4xl">Mis Reportes</h1>
        <Link
          href="/reportar"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-5 w-5" /> <span className="hidden sm:inline">Nuevo Reporte</span>
        </Link>
      </div>

      <div className="mt-6">
        <Tabs
          items={Object.entries(FILTERS).map(([key, f]) => ({
            href: key === "todos" ? "/mis-reportes" : `/mis-reportes?estado=${key}`,
            label: f.label,
            active: key === estado,
          }))}
        />
      </div>

      <div className="mt-8">
        <IncidentTable
          rows={rows}
          withThumbs
          withActions
          empty="Todavía no has enviado reportes en esta categoría."
        />
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        hrefFor={(p) => `/mis-reportes?${new URLSearchParams({ ...(estado !== "todos" && { estado }), page: String(p) })}`}
      />
    </div>
  );
}
