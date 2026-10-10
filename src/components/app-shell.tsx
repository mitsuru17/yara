"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Headset,
  House,
  Info,
  Map,
  PlusCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Brand, ShieldLogo } from "./logo";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";
import type { Profile } from "@/lib/types";

const NAV = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/reportar", label: "Reportar", icon: PlusCircle },
  { href: "/mis-reportes", label: "Mis Reportes", icon: FileText },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/informacion", label: "Información", icon: Info },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({
  profile,
  unreadCount,
  children,
}: {
  profile: Profile | null;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = profile?.role === "ADMIN"
    ? [...NAV, { href: "/admin", label: "Administración", icon: ShieldCheck }]
    : NAV;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Cabecera */}
      <header className="sticky top-0 z-[1000] border-b border-line bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 lg:h-[76px] lg:px-0">
          <Link
            href="/"
            className="hidden h-full w-72 shrink-0 items-center border-r border-line px-8 lg:flex"
          >
            <Brand />
          </Link>
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <ShieldLogo className="h-8 w-8" />
            <span className="font-bold">Seguridad Ciudadana</span>
          </Link>

          <nav className="hidden h-full flex-1 items-stretch gap-2 px-8 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center border-b-[3px] px-4 text-[15px] font-medium transition-colors ${
                  isActive(pathname, item.href)
                    ? "border-brand-600 text-brand-600"
                    : "border-transparent text-ink hover:text-brand-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 lg:pr-8">
            {profile ? (
              <>
                <NotificationBell userId={profile.id} initialUnread={unreadCount} />
                <UserMenu profile={profile} />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="hidden rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 sm:inline-flex"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Barra lateral (escritorio) */}
        <aside className="sticky top-[76px] hidden h-[calc(100vh-76px)] w-72 shrink-0 flex-col border-r border-line bg-canvas p-5 lg:flex">
          <nav className="flex flex-col gap-1.5">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors ${
                    active ? "bg-brand-100/70 text-brand-600" : "text-ink hover:bg-white"
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-line pt-5">
            <Link
              href="/informacion#contacto"
              className="flex items-center gap-3 px-3 py-2 text-sm text-ink hover:text-brand-600"
            >
              <Headset className="h-5 w-5" /> Ayuda / Contacto
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</main>
      </div>

      {/* Barra inferior (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-[1000] grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[
          NAV[0],
          NAV[1],
          NAV[2],
          { href: profile ? "/perfil" : "/login", label: "Perfil", icon: UserRound },
        ].map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                active ? "text-brand-600" : "text-muted"
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
