"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Info, LogOut, Map, ShieldCheck, UserRound } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";

export function UserMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = `${profile.name[0] ?? ""}${profile.lastname[0] ?? ""}`.toUpperCase() || "U";

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const linkClass = "flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-canvas";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-canvas"
        aria-expanded={open}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
          {initials}
        </span>
        <span className="hidden max-w-32 truncate font-semibold sm:block">{profile.name || "Usuario"}</span>
        <ChevronDown className="hidden h-4 w-4 sm:block" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-xl"
          onClick={() => setOpen(false)}
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate font-semibold">
              {profile.name} {profile.lastname}
            </p>
            <p className="truncate text-sm text-muted">{profile.email}</p>
          </div>
          <Link href="/perfil" className={linkClass}>
            <UserRound className="h-4 w-4" /> Mi perfil
          </Link>
          <Link href="/mapa" className={`${linkClass} lg:hidden`}>
            <Map className="h-4 w-4" /> Mapa de alertas
          </Link>
          <Link href="/informacion" className={`${linkClass} lg:hidden`}>
            <Info className="h-4 w-4" /> Información
          </Link>
          {profile.role === "ADMIN" && (
            <Link href="/admin" className={`${linkClass} lg:hidden`}>
              <ShieldCheck className="h-4 w-4" /> Administración
            </Link>
          )}
          <form action={signOut}>
            <button className={`${linkClass} w-full text-red-600`}>
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
