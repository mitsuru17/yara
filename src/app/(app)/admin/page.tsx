import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, AlertTriangle, CheckCircle2, EyeOff, Users } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { Tabs } from "@/components/tabs";
import { TypeIcon } from "@/components/type-icon";
import { daysAgoIso, formatDateTime, STATUS_LABEL } from "@/lib/format";
import { getSession } from "@/lib/session";
import type { IncidentStatus, IncidentType, Profile } from "@/lib/types";
import { AnnouncementForm, RowActions, UserStatusToggle } from "./admin-client";

export const metadata: Metadata = { title: "Administración" };

const PAGE_SIZE = 10;
const STATUS_FILTERS = ["PUBLISHED", "CLOSED", "HIDDEN"] as const;

type AdminIncident = {
  id: number;
  address: string;
  occurred_at: string;
  status: IncidentStatus;
  severity: string;
  incident_type_id: number;
  incident_types: { name: string; icon: string; color: string };
};

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const { supabase, profile } = await getSession();
  if (profile?.role !== "ADMIN") redirect("/");

  const sp = await searchParams;
  const vista = sp.vista === "usuarios" || sp.vista === "bitacora" ? sp.vista : "reportes";
  const estado = STATUS_FILTERS.find((s) => s === sp.estado) ?? null;
  const page = Math.max(1, Number(sp.page) || 1);

  // Indicadores (el admin puede leer toda la tabla por RLS).
  const since24h = daysAgoIso(1);
  const [all, users, last24, types] = await Promise.all([
    supabase.from("incidents").select("status, incident_type_id").returns<{ status: IncidentStatus; incident_type_id: number }[]>(),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("incidents").select("id", { count: "exact", head: true }).gte("created_at", since24h),
    supabase.from("incident_types").select("*").order("id").returns<IncidentType[]>(),
  ]);
  const rows = all.data ?? [];
  const byStatus = (s: IncidentStatus) => rows.filter((r) => r.status === s).length;
  const byType = (types.data ?? [])
    .map((t) => ({ ...t, total: rows.filter((r) => r.incident_type_id === t.id).length }))
    .sort((a, b) => b.total - a.total);
  const maxType = Math.max(1, ...byType.map((t) => t.total));

  const stats = [
    { label: "En proceso", value: byStatus("PUBLISHED"), icon: AlertTriangle, tone: "text-amber-600 bg-amber-50" },
    { label: "Atendidos", value: byStatus("CLOSED"), icon: CheckCircle2, tone: "text-green-600 bg-green-50" },
    { label: "Ocultos", value: byStatus("HIDDEN"), icon: EyeOff, tone: "text-red-600 bg-red-50" },
    { label: "Últimas 24 h", value: last24.count ?? 0, icon: Activity, tone: "text-brand-600 bg-brand-50" },
    { label: "Usuarios", value: users.count ?? 0, icon: Users, tone: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Administración</h1>
      <p className="mt-2 text-muted">Revisa reportes e indicadores, modera incidentes y envía comunicados.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line p-4">
            <span className={`inline-flex rounded-lg p-2 ${s.tone}`}><s.icon className="h-5 w-5" /></span>
            <p className="mt-3 text-3xl font-bold tabular-nums">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line p-5">
          <h2 className="font-bold">Incidentes por tipo</h2>
          <ul className="mt-4 space-y-3">
            {byType.map((t) => (
              <li key={t.id} className="grid grid-cols-[160px_1fr_32px] items-center gap-3 text-sm">
                <span className="truncate">{t.name}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-canvas">
                  <span className="block h-full rounded-full" style={{ width: `${(t.total / maxType) * 100}%`, backgroundColor: t.color }} />
                </span>
                <span className="text-right font-semibold tabular-nums">{t.total}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line p-5">
          <h2 className="font-bold">Enviar aviso o comunicado</h2>
          <p className="mt-1 text-sm text-muted">Se notificará en tiempo real a todos los vecinos activos.</p>
          <AnnouncementForm />
        </section>
      </div>

      <div className="mt-8">
        <Tabs
          items={[
            { href: "/admin", label: "Reportes", active: vista === "reportes" },
            { href: "/admin?vista=usuarios", label: "Usuarios", active: vista === "usuarios" },
            { href: "/admin?vista=bitacora", label: "Bitácora", active: vista === "bitacora" },
          ]}
        />
      </div>

      <div className="mt-6">
        {vista === "reportes" && <ReportsView supabase={supabase} estado={estado} page={page} />}
        {vista === "usuarios" && <UsersView supabase={supabase} me={profile.id} />}
        {vista === "bitacora" && <AuditView supabase={supabase} />}
      </div>
    </div>
  );
}

type Supa = Awaited<ReturnType<typeof getSession>>["supabase"];

async function ReportsView({ supabase, estado, page }: { supabase: Supa; estado: IncidentStatus | null; page: number }) {
  const from = (page - 1) * PAGE_SIZE;
  let query = supabase
    .from("incidents")
    .select("id, address, occurred_at, status, severity, incident_type_id, incident_types(name, icon, color)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (estado) query = query.eq("status", estado);
  const { data, count } = await query.returns<AdminIncident[]>();

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium ${active ? "border-brand-600 bg-brand-600 text-white" : "border-line hover:border-brand-500"}`;

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin" className={chip(!estado)}>Todos</Link>
        {STATUS_FILTERS.map((s) => (
          <Link key={s} href={`/admin?estado=${s}`} className={chip(estado === s)}>{STATUS_LABEL[s]}</Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-canvas font-semibold">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Gravedad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-muted">{r.id}</td>
                <td className="px-4 py-3">
                  <Link href={`/reportes/${r.id}`} className="flex items-center gap-2 font-semibold hover:text-brand-600">
                    <TypeIcon icon={r.incident_types.icon} color={r.incident_types.color} size="sm" />
                    {r.incident_types.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.address}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatDateTime(r.occurred_at)}</td>
                <td className="px-4 py-3">{r.severity}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3"><RowActions incidentId={r.id} status={r.status} /></td>
              </tr>
            ))}
            {data?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Sin reportes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={Math.ceil((count ?? 0) / PAGE_SIZE)}
        hrefFor={(p) => `/admin?${new URLSearchParams({ ...(estado && { estado }), page: String(p) })}`}
      />
    </>
  );
}

async function UsersView({ supabase, me }: { supabase: Supa; me: string }) {
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).returns<Profile[]>();
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-canvas font-semibold">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Correo</th>
            <th className="px-4 py-3">Rol</th>
            <th className="px-4 py-3">Registro</th>
            <th className="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {(data ?? []).map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-semibold">{u.name} {u.lastname}</td>
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3">{u.role === "ADMIN" ? "Administrador" : "Vecino"}</td>
              <td className="whitespace-nowrap px-4 py-3">{formatDateTime(u.created_at)}</td>
              <td className="px-4 py-3">
                {u.id === me ? <span className="text-muted">Tú</span> : <UserStatusToggle userId={u.id} status={u.status} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function AuditView({ supabase }: { supabase: Supa }) {
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, entity, entity_id, created_at, profiles(name, lastname, email)")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<{ id: number; action: string; entity: string; entity_id: number | null; created_at: string; profiles: { name: string; lastname: string; email: string } | null }[]>();
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-canvas font-semibold">
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Usuario</th>
            <th className="px-4 py-3">Acción</th>
            <th className="px-4 py-3">Entidad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {(data ?? []).map((l) => (
            <tr key={l.id}>
              <td className="whitespace-nowrap px-4 py-3">{formatDateTime(l.created_at)}</td>
              <td className="px-4 py-3">{l.profiles ? l.profiles.email : <span className="text-muted">Sistema</span>}</td>
              <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
              <td className="px-4 py-3">
                {l.entity === "incidents" && l.entity_id ? (
                  <Link href={`/reportes/${l.entity_id}`} className="text-brand-600 hover:underline">incidente #{l.entity_id}</Link>
                ) : `${l.entity} #${l.entity_id ?? "-"}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
