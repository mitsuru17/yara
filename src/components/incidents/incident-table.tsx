import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, Eye, MapPin } from "lucide-react";
import { TypeIcon } from "@/components/type-icon";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import type { IncidentStatus } from "@/lib/types";

export type IncidentRow = {
  id: number;
  type_name: string;
  type_icon: string;
  type_color: string;
  address: string;
  occurred_at: string;
  status: IncidentStatus;
  cover_url: string | null;
};

function Thumb({ row, className }: { row: IncidentRow; className: string }) {
  if (row.cover_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={row.cover_url} alt="" className={`${className} object-cover`} />;
  }
  return (
    <div
      className={`${className} flex items-center justify-center`}
      style={{ backgroundColor: `${row.type_color}14` }}
    >
      <TypeIcon icon={row.type_icon} color={row.type_color} size="lg" />
    </div>
  );
}

/** Tabla en escritorio + tarjetas en móvil, como en los mockups. */
export function IncidentTable({
  rows,
  withThumbs = false,
  withActions = false,
  empty = "No hay reportes para mostrar.",
}: {
  rows: IncidentRow[];
  withThumbs?: boolean;
  withActions?: boolean;
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
        {empty}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-line md:block">
        <table className="w-full text-left">
          <thead className="bg-canvas text-[15px] font-semibold">
            <tr>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-4 py-4">Ubicación</th>
              <th className="px-4 py-4">Fecha y hora</th>
              <th className="px-4 py-4">Estado</th>
              {withActions && <th className="px-4 py-4 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="group hover:bg-canvas/60">
                <td className="px-6 py-4">
                  <Link href={`/reportes/${row.id}`} className="flex items-center gap-4">
                    {withThumbs && <Thumb row={row} className="h-20 w-28 shrink-0 rounded-lg" />}
                    <TypeIcon icon={row.type_icon} color={row.type_color} size={withThumbs ? "sm" : "md"} />
                    <span className="font-semibold group-hover:text-brand-600">{row.type_name}</span>
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <span className="flex items-center gap-2 text-ink/90">
                    <MapPin className="h-5 w-5 shrink-0 text-muted" />
                    {row.address}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="flex items-center gap-2 whitespace-nowrap text-ink/90">
                    <CalendarDays className="h-5 w-5 text-muted" />
                    {formatDateTime(row.occurred_at)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={row.status} />
                </td>
                {withActions && (
                  <td className="px-4 py-4 text-center">
                    <Link
                      href={`/reportes/${row.id}`}
                      aria-label="Ver reporte"
                      className="inline-flex rounded-full p-2 text-brand-600 hover:bg-brand-50"
                    >
                      <Eye className="h-6 w-6" />
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/reportes/${row.id}`}
              className="flex items-center gap-3 rounded-2xl border border-line p-3"
            >
              <Thumb row={row} className="h-24 w-28 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="flex items-center gap-2 font-semibold">
                  <TypeIcon icon={row.type_icon} color={row.type_color} size="sm" />
                  <span className="truncate">{row.type_name}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-ink/80">
                  <MapPin className="h-4 w-4 shrink-0 text-muted" />
                  <span className="truncate">{row.address}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-ink/80">
                  <Clock className="h-4 w-4 shrink-0 text-muted" />
                  {formatDateTime(row.occurred_at)}
                </p>
                {withActions && <StatusBadge status={row.status} />}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
