import type { IncidentStatus, Severity, VoteType } from "./types";

const TZ = "America/Lima";

const timeFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});
const dateFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });

/** "Hoy, 09:30 a. m." | "Ayer, 06:15 p. m." | "12/05/2026, 03:20 p. m." */
export function formatDateTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = timeFmt.format(date);
  const day = dayKeyFmt.format(date);
  const today = dayKeyFmt.format(now);
  const yesterday = dayKeyFmt.format(new Date(now.getTime() - 86_400_000));
  if (day === today) return `Hoy, ${time}`;
  if (day === yesterday) return `Ayer, ${time}`;
  return `${dateFmt.format(date)}, ${time}`;
}

export function timeAgo(iso: string, now = new Date()): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

/** Valor para <input type="datetime-local"> en hora de Lima. */
export function toLimaInputValue(date = new Date()): string {
  const lima = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  return lima.toISOString().slice(0, 16);
}

/** Perú no usa horario de verano: UTC-05:00 todo el año. */
export function fromLimaInputValue(value: string): string {
  return new Date(`${value}:00-05:00`).toISOString();
}

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  PENDING: "Pendiente",
  PUBLISHED: "En proceso",
  CLOSED: "Atendido",
  HIDDEN: "Oculto",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
};

export const VOTE_LABEL: Record<VoteType, string> = {
  CONFIRMADO: "Confirmo",
  YO_LO_VI: "Yo lo vi",
  IMPORTANTE: "Importante",
};

export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
