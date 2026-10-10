import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const cell = "flex h-11 w-11 items-center justify-center border-r border-line last:border-r-0";
  return (
    <nav aria-label="Paginación" className="mt-8 flex justify-center">
      <div className="flex overflow-hidden rounded-xl border border-line">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} aria-label="Anterior" className={`${cell} text-brand-600 hover:bg-canvas`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <span className={`${cell} text-slate-300`}><ChevronLeft className="h-5 w-5" /></span>
        )}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${cell} font-medium ${p === page ? "bg-brand-50 text-brand-600" : "hover:bg-canvas"}`}
          >
            {p}
          </Link>
        ))}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} aria-label="Siguiente" className={`${cell} text-brand-600 hover:bg-canvas`}>
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <span className={`${cell} text-slate-300`}><ChevronRight className="h-5 w-5" /></span>
        )}
      </div>
    </nav>
  );
}
