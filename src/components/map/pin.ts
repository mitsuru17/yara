import L from "leaflet";

export { SJM_CENTER, TILE_ATTRIBUTION, TILE_URL } from "./constants";

export function pinIcon(color: string, size = 34) {
  return L.divIcon({
    className: "yara-pin",
    iconSize: [size, size * 1.3],
    iconAnchor: [size / 2, size * 1.3],
    popupAnchor: [0, -size * 1.2],
    html: `<svg viewBox="0 0 24 31" width="${size}" height="${size * 1.3}" style="filter:drop-shadow(0 2px 3px rgba(15,27,61,.35))">
      <path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 31 12 31s12-10.2 12-19.1C24 5.3 18.6 0 12 0Z" fill="${color}"/>
      <circle cx="12" cy="11.5" r="4.6" fill="#fff"/></svg>`,
  });
}
