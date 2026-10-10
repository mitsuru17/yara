export function ShieldLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M24 3 6 9.5v12.2C6 33.6 13.7 42 24 45c10.3-3 18-11.4 18-23.3V9.5L24 3Z"
        fill="#0b4fe0"
      />
      <path
        d="M24 7.3 10 12.4v9.3c0 9.6 6 16.6 14 19.3 8-2.7 14-9.7 14-19.3v-9.3L24 7.3Z"
        fill="#1e3a8a"
      />
      <path
        d="m24 14 2.9 6 6.6.8-4.9 4.5 1.3 6.5L24 28.6l-5.9 3.2 1.3-6.5-4.9-4.5 6.6-.8L24 14Z"
        fill="#fff"
      />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <ShieldLogo className={compact ? "h-8 w-8" : "h-10 w-10"} />
      <div className="leading-tight">
        <p className="whitespace-nowrap font-bold text-ink">Seguridad Ciudadana</p>
        {!compact && <p className="whitespace-nowrap text-sm text-muted">YARA · Tu distrito más seguro</p>}
      </div>
    </div>
  );
}
