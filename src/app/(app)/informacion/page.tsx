import type { Metadata } from "next";
import { BellRing, FileText, Lock, MapPinned, Phone, ShieldAlert } from "lucide-react";

export const metadata: Metadata = { title: "Información" };

const STEPS = [
  { icon: FileText, title: "1. Reporta", text: "Elige el tipo de incidente, la fecha y describe lo ocurrido. Puedes adjuntar fotos." },
  { icon: MapPinned, title: "2. Ubica", text: "Marca el punto exacto en el mapa o busca la dirección. Así se identifican zonas de riesgo." },
  { icon: BellRing, title: "3. Alerta", text: "Al enviar, YARA publica la alerta y notifica en tiempo real a los vecinos de la comunidad." },
];

const CONTACTS = [
  { name: "Emergencias Policía Nacional", phone: "105" },
  { name: "Bomberos", phone: "116" },
  { name: "SAMU (ambulancias)", phone: "106" },
  { name: "Línea 100 (violencia familiar)", phone: "100" },
  { name: "Serenazgo San Juan de Miraflores", phone: "(01) 450-1414" },
];

export default function InfoPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 lg:py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Información</h1>
      <p className="mt-3 text-lg text-muted">
        YARA es una plataforma comunitaria que centraliza los reportes de seguridad ciudadana de tu
        distrito y los muestra en un mapa para prevenir y coordinar entre vecinos.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-2xl border border-line p-5">
            <s.icon className="h-7 w-7 text-brand-600" />
            <h2 className="mt-3 font-bold">{s.title}</h2>
            <p className="mt-1 text-sm text-muted">{s.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <ShieldAlert className="h-6 w-6 shrink-0 text-amber-700" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold">YARA no reemplaza a la Policía ni al Serenazgo</p>
          <p className="mt-1">
            Los reportes publicados son información comunitaria: no constituyen denuncias oficiales
            ni han sido validados por la PNP o la municipalidad. Ante una emergencia, llama
            primero a los números oficiales.
          </p>
        </div>
      </section>

      <section id="contacto" className="mt-10 scroll-mt-24">
        <h2 className="text-2xl font-bold">Ayuda / Contacto</h2>
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line">
          {CONTACTS.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-4 px-5 py-4">
              <span>{c.name}</span>
              <a href={`tel:${c.phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-2 font-semibold text-brand-600 hover:underline">
                <Phone className="h-4 w-4" /> {c.phone}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Soporte de la plataforma: <a className="text-brand-600 hover:underline" href="mailto:soporte@yara.pe">soporte@yara.pe</a>
        </p>
      </section>

      <section id="privacidad" className="mt-10 scroll-mt-24">
        <h2 className="flex items-center gap-2 text-2xl font-bold"><Lock className="h-6 w-6" /> Privacidad y datos personales</h2>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink/90">
          <p>
            YARA trata tus datos conforme a la Ley N.° 29733, Ley de Protección de Datos Personales,
            y su reglamento. Solo solicitamos los datos necesarios para crear tu cuenta (nombre,
            correo y, opcionalmente, celular).
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Tus reportes se publican de forma <strong>anónima</strong>: otros vecinos no ven tu nombre ni tu correo.</li>
            <li>Las contraseñas se almacenan cifradas y la comunicación se realiza mediante HTTPS.</li>
            <li>El acceso a la información se controla por rol (vecino / administrador) con políticas de seguridad a nivel de fila.</li>
            <li>Las acciones de moderación quedan registradas en una bitácora de auditoría.</li>
            <li>Puedes solicitar la rectificación o cancelación de tus datos escribiendo a soporte.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
