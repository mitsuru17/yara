import Link from "next/link";

export function Tabs({ items }: { items: { href: string; label: string; active: boolean; count?: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`-mb-px whitespace-nowrap border-b-[3px] px-6 py-3 text-[15px] font-medium transition ${
            t.active ? "border-brand-600 text-brand-600" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-2 text-sm opacity-70">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}
