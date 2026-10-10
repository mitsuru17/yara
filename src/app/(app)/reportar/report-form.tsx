"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  CalendarDays,
  ChevronDown,
  CloudUpload,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import { LocationPicker } from "@/components/map";
import type { LatLng } from "@/components/map/location-picker-inner";
import { SJM_CENTER } from "@/components/map/constants";
import { TypeIcon } from "@/components/type-icon";
import { inputClass } from "@/components/form-fields";
import { createClient } from "@/lib/supabase/client";
import { fromLimaInputValue, SEVERITY_LABEL, toLimaInputValue } from "@/lib/format";
import type { IncidentType, Severity } from "@/lib/types";

const MAX_FILES = 3;
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const SJM_VIEWBOX = "-77.00,-12.13,-76.93,-12.19";
const LIMA_VIEWBOX = "-77.2,-11.7,-76.6,-12.5";

const schema = z.object({
  incident_type_id: z.coerce.number().int().positive({ message: "Selecciona el tipo de incidente" }),
  address: z.string().trim().min(3, "Indica la ubicación del incidente").max(255),
  occurred_at: z
    .string()
    .min(1, "Indica la fecha y hora")
    .refine((v) => new Date(fromLimaInputValue(v)).getTime() <= Date.now() + 60_000, {
      message: "La fecha no puede ser futura",
    }),
  description: z
    .string()
    .trim()
    .min(10, "Describe lo ocurrido (mínimo 10 caracteres)")
    .max(500, "Máximo 500 caracteres"),
  severity: z.enum(["BAJA", "MEDIA", "ALTA"]),
});

type NominatimResult = { place_id: number; display_name: string; lat: string; lon: string };

function shortAddress(displayName: string) {
  return displayName.split(",").slice(0, 2).join(",").trim();
}

export function ReportForm({ types, userId }: { types: IncidentType[]; userId: string }) {
  const router = useRouter();
  const [supabase] = useState(createClient);

  const [typeId, setTypeId] = useState("");
  const [address, setAddress] = useState("");
  const [position, setPosition] = useState<LatLng>({ lat: SJM_CENTER[0], lng: SJM_CENTER[1] });
  const [occurredAt, setOccurredAt] = useState(() => toLimaInputValue());
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("MEDIA");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedType = types.find((t) => String(t.id) === typeId);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  // Geocodificación con OpenStreetMap Nominatim, limitada a Lima.
  async function search() {
    if (query.trim().length < 3) return;
    setSearching(true);
    const lookup = async (viewbox: string) => {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        countrycodes: "pe",
        viewbox,
        bounded: "1",
        limit: "5",
        "accept-language": "es",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
      return res.ok ? ((await res.json()) as NominatimResult[]) : [];
    };
    try {
      // Primero el distrito piloto (San Juan de Miraflores); si no hay resultados, toda Lima.
      const local = await lookup(SJM_VIEWBOX);
      setResults(local.length ? local : await lookup(LIMA_VIEWBOX));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function pickResult(r: NominatimResult) {
    setPosition({ lat: Number(r.lat), lng: Number(r.lon) });
    setAddress(shortAddress(r.display_name));
    setQuery(shortAddress(r.display_name));
    setResults(null);
  }

  async function reverseGeocode(p: LatLng) {
    try {
      const params = new URLSearchParams({
        lat: String(p.lat),
        lon: String(p.lng),
        format: "json",
        zoom: "18",
        "accept-language": "es",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const a = data.address ?? {};
      const label = [a.road ?? a.pedestrian ?? a.park ?? a.neighbourhood, a.house_number]
        .filter(Boolean)
        .join(" ");
      if (label) {
        setAddress(label);
        setQuery(label);
      }
    } catch {
      // Sin conexión con el geocodificador: el usuario puede escribir la dirección.
    }
  }

  function movePin(p: LatLng) {
    setPosition(p);
    reverseGeocode(p);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setError("Tu navegador no permite obtener la ubicación.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        movePin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setError("No pudimos obtener tu ubicación. Mueve el marcador en el mapa.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!ACCEPTED.includes(f.type)) {
        setError("Formato no permitido. Usa JPG, PNG o WEBP.");
        continue;
      }
      if (f.size > MAX_SIZE) {
        setError(`"${f.name}" supera los 5 MB.`);
        continue;
      }
      if (next.length >= MAX_FILES) {
        setError(`Puedes adjuntar como máximo ${MAX_FILES} fotos.`);
        break;
      }
      next.push(f);
    }
    setFiles(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({
      incident_type_id: typeId,
      address: address || query,
      occurred_at: occurredAt,
      description,
      severity,
    });
    if (!parsed.success) return setError(parsed.error.issues[0].message);

    setSubmitting(true);
    const values = parsed.data;
    const { data: incident, error: insertError } = await supabase
      .from("incidents")
      .insert({
        user_id: userId,
        incident_type_id: values.incident_type_id,
        title: selectedType?.name ?? "Incidente",
        description: values.description,
        address: values.address,
        latitude: Number(position.lat.toFixed(8)),
        longitude: Number(position.lng.toFixed(8)),
        occurred_at: fromLimaInputValue(values.occurred_at),
        severity: values.severity,
      })
      .select("id")
      .single();

    if (insertError || !incident) {
      setSubmitting(false);
      return setError("No se pudo registrar el reporte. Inténtalo nuevamente.");
    }

    // Fotos opcionales: un fallo aquí no invalida el reporte ya registrado.
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${incident.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("incident-files")
        .upload(path, file, { contentType: file.type });
      if (uploadError) continue;
      const { data: pub } = supabase.storage.from("incident-files").getPublicUrl(path);
      await supabase
        .from("incident_files")
        .insert({ incident_id: incident.id, file_url: pub.publicUrl, file_type: file.type });
    }

    router.push(`/reportes/${incident.id}?nuevo=1`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]" noValidate>
      <div className="space-y-6">
        {/* Tipo */}
        <div>
          <label htmlFor="type" className="mb-2 block text-[15px] font-semibold">
            Tipo de incidente
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
              {selectedType ? (
                <TypeIcon icon={selectedType.icon} color={selectedType.color} size="sm" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <ShieldAlert className="h-4 w-4" />
                </span>
              )}
            </span>
            <select
              id="type"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className={`${inputClass} appearance-none pl-14 pr-10 ${typeId ? "" : "text-slate-400"}`}
            >
              <option value="">Selecciona un tipo</option>
              {types.map((t) => (
                <option key={t.id} value={t.id} className="text-ink">
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          </div>
          {selectedType?.description && (
            <p className="mt-1.5 text-xs text-muted">{selectedType.description}</p>
          )}
        </div>

        {/* Ubicación */}
        <div className="relative">
          <label htmlFor="location" className="mb-2 block text-[15px] font-semibold">
            Ubicación del incidente
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="location"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setAddress(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  search();
                }
              }}
              placeholder="Buscar dirección o lugar"
              className={`${inputClass} pl-12 pr-24`}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={search}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-100"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </button>
          </div>
          {results && (
            <ul className="absolute z-[1001] mt-1 w-full overflow-hidden rounded-xl border border-line bg-white shadow-lg">
              {results.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted">
                  Sin resultados. Ajusta el marcador en el mapa.
                </li>
              )}
              {results.map((r) => (
                <li key={r.place_id}>
                  <button
                    type="button"
                    onClick={() => pickResult(r)}
                    className="flex w-full items-start gap-2 px-4 py-3 text-left text-sm hover:bg-canvas"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mapa en móvil (en escritorio va en la columna derecha) */}
        <MapPanel className="lg:hidden" position={position} onChange={movePin} locating={locating} onLocate={useMyLocation} />

        {/* Fecha y severidad */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="occurred_at" className="mb-2 block text-[15px] font-semibold">
              Fecha y hora
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600" />
              <input
                id="occurred_at"
                type="datetime-local"
                value={occurredAt}
                max={toLimaInputValue()}
                onChange={(e) => setOccurredAt(e.target.value)}
                className={`${inputClass} pl-12`}
              />
            </div>
          </div>
          <fieldset>
            <legend className="mb-2 block text-[15px] font-semibold">Gravedad</legend>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-line p-1">
              {(["BAJA", "MEDIA", "ALTA"] as const).map((s) => (
                <label
                  key={s}
                  className={`cursor-pointer rounded-lg py-2 text-center text-sm font-semibold transition ${
                    severity === s
                      ? s === "ALTA"
                        ? "bg-red-600 text-white"
                        : s === "MEDIA"
                          ? "bg-amber-500 text-white"
                          : "bg-green-600 text-white"
                      : "text-muted hover:bg-canvas"
                  }`}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={s}
                    checked={severity === s}
                    onChange={() => setSeverity(s)}
                    className="sr-only"
                  />
                  {SEVERITY_LABEL[s]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="mb-2 block text-[15px] font-semibold">
            Descripción
          </label>
          <div className="relative">
            <textarea
              id="description"
              rows={4}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuéntanos qué ocurrió…"
              className={`${inputClass} resize-none pb-8`}
            />
            <span className="absolute bottom-3 right-4 text-sm text-muted">
              {description.length}/500
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            No incluyas nombres, DNI ni datos personales de terceros.
          </p>
        </div>

        {/* Fotos */}
        <div>
          <p className="mb-2 text-[15px] font-semibold">
            Agregar fotos <span className="font-normal text-muted">(opcional)</span>
          </p>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm text-muted transition ${
              dragOver ? "border-brand-500 bg-brand-50" : "border-brand-100 bg-canvas/50 hover:border-brand-500"
            }`}
          >
            <CloudUpload className="h-9 w-9 text-brand-500" />
            Haz clic o arrastra imágenes aquí
            <span className="text-xs">Formatos: JPG, PNG (Máx. 5MB c/u · hasta {MAX_FILES})</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {files.length > 0 && (
            <ul className="mt-3 flex gap-3">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previews[i]} alt={f.name} className="h-20 w-20 rounded-lg object-cover" />
                  <button
                    type="button"
                    aria-label={`Quitar ${f.name}`}
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-brand-600 py-4 text-lg font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {submitting ? "Enviando…" : "Enviar Reporte"}
        </button>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-5">
          <MapPanel position={position} onChange={movePin} locating={locating} onLocate={useMyLocation} />
        </div>
      </div>
    </form>
  );
}

function MapPanel({
  position,
  onChange,
  locating,
  onLocate,
  className = "",
}: {
  position: LatLng;
  onChange: (p: LatLng) => void;
  locating: boolean;
  onLocate: () => void;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative h-72 overflow-hidden rounded-2xl border border-line lg:h-[540px]">
        <LocationPicker position={position} onChange={onChange} />
        <button
          type="button"
          onClick={onLocate}
          aria-label="Usar mi ubicación actual"
          className="absolute bottom-4 right-4 z-[1000] rounded-full bg-white p-3 text-brand-600 shadow-lg hover:bg-brand-50"
        >
          {locating ? <Loader2 className="h-6 w-6 animate-spin" /> : <LocateFixed className="h-6 w-6" />}
        </button>
      </div>
      <div className="flex gap-3 rounded-2xl border border-line p-5">
        <Info className="h-6 w-6 shrink-0 fill-brand-600 text-white" />
        <div>
          <p className="font-semibold">Tu ubicación en el mapa</p>
          <p className="mt-1 text-sm text-muted">
            Puedes mover el marcador o tocar el mapa para ajustar la ubicación exacta del incidente.
          </p>
        </div>
      </div>
    </div>
  );
}
