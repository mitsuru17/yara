import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { getSession } from "@/lib/session";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const { supabase, profile } = await getSession();
  if (!profile) redirect("/login?next=/perfil");

  const { count } = await supabase
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 lg:py-10">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">
          {`${profile.name[0] ?? ""}${profile.lastname[0] ?? ""}`.toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold">{profile.name} {profile.lastname}</h1>
          <p className="text-muted">
            {profile.role === "ADMIN" ? "Administrador" : "Vecino"} · {count ?? 0} reportes enviados
          </p>
        </div>
      </div>
      <div className="mt-8 rounded-2xl border border-line p-5 sm:p-6">
        <ProfileForm profile={profile} />
      </div>
      <form action={signOut} className="mt-6">
        <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-red-600 hover:bg-red-50">
          <LogOut className="h-5 w-5" /> Cerrar sesión
        </button>
      </form>
    </div>
  );
}
