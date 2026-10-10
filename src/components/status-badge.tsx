import { STATUS_LABEL } from "@/lib/format";
import type { IncidentStatus } from "@/lib/types";

const STYLES: Record<IncidentStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  PUBLISHED: "bg-amber-50 text-amber-700",
  CLOSED: "bg-green-50 text-green-700",
  HIDDEN: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ${STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
