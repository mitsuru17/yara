import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-bold">Iniciar sesión</h1>
      <p className="mt-2 text-muted">Ingresa para reportar incidentes y recibir alertas.</p>
      <div className="mt-8">
        <LoginForm next={typeof next === "string" ? next : "/"} />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-brand-600 hover:underline">
          Regístrate
        </Link>
      </p>
      <div className="mt-8 rounded-xl border border-dashed border-line p-4 text-sm text-muted">
        <p className="font-semibold text-ink">Cuentas de demostración</p>
        <p className="mt-1">Vecino: vecino@yara.pe · Admin: admin@yara.pe</p>
        <p>Contraseña: Yara2026!</p>
      </div>
    </>
  );
}
