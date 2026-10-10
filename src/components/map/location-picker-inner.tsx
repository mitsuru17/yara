"use client";

import { useEffect, useMemo, useRef } from "react";
import { Circle, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import { MapContainer } from "./map-container";
import { TILE_ATTRIBUTION, TILE_URL, pinIcon } from "./pin";

export type LatLng = { lat: number; lng: number };

function Recenter({ position }: { position: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([position.lat, position.lng], Math.max(map.getZoom(), 16));
  }, [map, position]);
  return null;
}

function ClickToMove({ onChange }: { onChange: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export default function LocationPickerInner({
  position,
  onChange,
}: {
  position: LatLng;
  onChange: (p: LatLng) => void;
}) {
  const markerRef = useRef<LeafletMarker>(null);
  const icon = useMemo(() => pinIcon("#0b4fe0", 40), []);

  return (
    <MapContainer center={[position.lat, position.lng]} zoom={16} className="h-full w-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <Recenter position={position} />
      <ClickToMove onChange={onChange} />
      <Circle
        center={[position.lat, position.lng]}
        radius={45}
        pathOptions={{ color: "#2463eb", fillColor: "#2463eb", fillOpacity: 0.15, weight: 0 }}
      />
      <Marker
        draggable
        ref={markerRef}
        position={[position.lat, position.lng]}
        icon={icon}
        eventHandlers={{
          dragend: () => {
            const ll = markerRef.current?.getLatLng();
            if (ll) onChange({ lat: ll.lat, lng: ll.lng });
          },
        }}
      />
    </MapContainer>
  );
}
