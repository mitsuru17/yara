import Link from "next/link";
import { Brand } from "@/components/logo";
import { CityIllustration } from "@/components/city-illustration";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link href="/" className="w-fit">
          <Brand />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
      <div className="hidden flex-col justify-center gap-8 bg-canvas p-12 lg:flex">
        <CityIllustration />
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold">Alertas vecinales organizadas, en un solo lugar.</h2>
          <p className="mt-3 text-lg text-muted">
            Registra incidentes con ubicación, consúltalos en el mapa y recibe alertas en tiempo
            real de lo que ocurre en tu comunidad.
          </p>
        </div>
      </div>
    </div>
  );
}
