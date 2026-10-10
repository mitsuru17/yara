import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Gauge, MapPin, MessageSquare } from "lucide-react";
import { IncidentsMap } from "@/components/map";
import { StatusBadge } from "@/components/status-badge";
import { TypeIcon } from "@/components/type-icon";
import { formatDateTime, SEVERITY_LABEL, timeAgo } from "@/lib/format";
import { getSession } from "@/lib/session";
import type { FeedIncident, VoteType } from "@/lib/types";
import { AdminIncidentActions } from "./admin-actions";
import { CommentForm, DeleteCommentButton } from "./comments";
import { VoteButtons } from "./vote-buttons";

export const metadata: Metadata = { title: "Detalle del reporte" };

type BaseRow = Omit<FeedIncident, "type_name" | "type_icon" | "type_color" | "cover_url" | "votes_count" | "comments_count"> & {
  user_id: string;
  incident_types: { name: string; icon: string; color: string };
};

export default async function IncidentPage({ params, searchParams }: PageProps<"/reportes/[id]">) {
  const { id: rawId } = await params;
  const { nuevo } = await searchParams;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const { supabase, profile } = await getSession();
  const isAdmin = profile?.role === "ADMIN";

  // Primero la vista pública; si no aparece (p. ej. oculto), el dueño o el admin lo ven desde la tabla.
  let incident = (
    await supabase.from("incident_feed").select("*").eq("id", id).maybeSingle<FeedIncident>()
  ).data;
  let isOwner = false;
  if (profile) {
    const { data: base } = await supabase
      .from("incidents")
      .select("*, incident_types(name, icon, color)")
      .eq("id", id)
      .maybeSingle<BaseRow>();
    if (base) {
      isOwner = base.user_id === profile.id;
      incident ??= {
        ...base,
        type_name: base.incident_types.name,
        type_icon: base.incident_types.icon,
        type_color: base.incident_types.color,
        cover_url: null,
        votes_count: 0,
        comments_count: 0,
      };
    }
  }
  if (!incident) notFound();

  const [{ data: files }, votesRes, commentsRes] = await Promise.all([
    supabase.from("incident_files").select("id, file_url").eq("incident_id", id).order("id"),
    profile
      ? supabase.from("incident_votes").select("type, user_id").eq("incident_id", id)
      : Promise.resolve({ data: [] as { type: VoteType; user_id: string }[] }),
    profile
      ? supabase.from("comment_feed").select("*").eq("incident_id", id).order("created_at")
      : Promise.resolve({ data: [] }),
  ]);
  const votes = (votesRes.data ?? []) as { type: VoteType; user_id: string }[];
  const comments = (commentsRes.data ?? []) as {
    id: number;
    user_id: string;
    author: string;
    message: string;
    created_at: string;
  }[];

  const counts = { CONFIRMADO: 0, YO_LO_VI: 0, IMPORTANTE: 0 } as Record<VoteType, number>;
  const mine = new Set<VoteType>();
  for (const v of votes) {
    counts[v.type]++;
    if (v.user_id === profile?.id) mine.add(v.type);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <Link href={isOwner ? "/mis-reportes" : "/mapa"} className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      {nuevo && (
        <div role="status" className="mt-4 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">¡Reporte enviado!</p>
            <p className="text-sm">Se publicó la alerta y se notificó a los vecinos de la comunidad. Gracias por ayudar.</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <TypeIcon icon={incident.type_icon} color={incident.type_color} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold">{incident.type_name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <StatusBadge status={incident.status} />
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                  <Gauge className="h-4 w-4" /> Gravedad {SEVERITY_LABEL[incident.severity].toLowerCase()}
                </span>
                {isOwner && <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-600">Tu reporte</span>}
              </div>
            </div>
          </div>

          <dl className="grid gap-3 rounded-2xl border border-line p-5 sm:grid-cols-2">
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 shrink-0 text-muted" />
              <div><dt className="text-xs text-muted">Ubicación</dt><dd className="font-medium">{incident.address}</dd></div>
            </div>
            <div className="flex gap-3">
              <CalendarDays className="h-5 w-5 shrink-0 text-muted" />
              <div><dt className="text-xs text-muted">Fecha y hora</dt><dd className="font-medium">{formatDateTime(incident.occurred_at)}</dd></div>
            </div>
          </dl>

          <div>
            <h2 className="mb-2 font-semibold">Descripción</h2>
            <p className="whitespace-pre-line leading-relaxed text-ink/90">{incident.description}</p>
          </div>

          {files && files.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {files.map((f) => (
                <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.file_url} alt="Foto del incidente" className="aspect-[4/3] w-full object-cover transition hover:scale-105" />
                </a>
              ))}
            </div>
          )}

          {profile ? (
            <VoteButtons incidentId={id} counts={counts} mine={[...mine]} />
          ) : null}

          {isAdmin && <AdminIncidentActions incidentId={id} status={incident.status} />}

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <MessageSquare className="h-5 w-5" /> Comentarios
              {profile && <span className="text-base font-normal text-muted">({comments.length})</span>}
            </h2>
            {profile ? (
              <>
                <ul className="space-y-3">
                  {comments.map((c) => (
                    <li key={c.id} className="rounded-2xl bg-canvas p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {c.author || "Vecino"} <span className="font-normal text-muted">· {timeAgo(c.created_at)}</span>
                        </p>
                        {(c.user_id === profile.id || isAdmin) && (
                          <DeleteCommentButton commentId={c.id} incidentId={id} />
                        )}
                      </div>
                      <p className="mt-1 text-[15px]">{c.message}</p>
                    </li>
                  ))}
                  {comments.length === 0 && <li className="text-sm text-muted">Sé el primero en comentar.</li>}
                </ul>
                <CommentForm incidentId={id} />
              </>
            ) : (
              <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">
                <Link href={`/login?next=/reportes/${id}`} className="font-semibold text-brand-600 hover:underline">Inicia sesión</Link>{" "}
                para ver los comentarios, confirmar el reporte y recibir alertas.
              </p>
            )}
          </section>
        </div>

        <div>
          <div className="sticky top-24 h-80 overflow-hidden rounded-2xl border border-line lg:h-[460px]">
            <IncidentsMap incidents={[incident]} zoom={16} linkable={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
