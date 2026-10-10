"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { MapContainer } from "./map-container";
import { SJM_CENTER, TILE_ATTRIBUTION, TILE_URL, pinIcon } from "./pin";
import { formatDateTime, STATUS_LABEL } from "@/lib/format";
import type { FeedIncident } from "@/lib/types";

export type MapIncident = Pick<
  FeedIncident,
  "id" | "type_name" | "type_color" | "latitude" | "longitude" | "address" | "occurred_at" | "status"
>;

function FitBounds({ incidents }: { incidents: MapIncident[] }) {
  const map = useMap();
  useEffect(() => {
    if (incidents.length > 1) {
      map.fitBounds(
        L.latLngBounds(incidents.map((i) => [Number(i.latitude), Number(i.longitude)])),
        { padding: [40, 40], maxZoom: 16 },
      );
    }
  }, [map, incidents]);
  return null;
}

export default function IncidentsMapInner({
  incidents,
  zoom = 14,
  linkable = true,
}: {
  incidents: MapIncident[];
  zoom?: number;
  linkable?: boolean;
}) {
  const center: [number, number] =
    incidents.length === 1
      ? [Number(incidents[0].latitude), Number(incidents[0].longitude)]
      : SJM_CENTER;

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <FitBounds incidents={incidents} />
      {incidents.map((i) => (
        <Marker
          key={i.id}
          position={[Number(i.latitude), Number(i.longitude)]}
          icon={pinIcon(i.status === "CLOSED" ? "#16a34a" : i.type_color)}
        >
          <Popup>
            <p className="!m-0 font-semibold">{i.type_name}</p>
            <p className="!m-0 text-slate-600">{i.address}</p>
            <p className="!m-0 text-slate-600">
              {formatDateTime(i.occurred_at)} · {STATUS_LABEL[i.status]}
            </p>
            {linkable && (
              <Link href={`/reportes/${i.id}`} className="font-semibold">
                Ver detalle →
              </Link>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
