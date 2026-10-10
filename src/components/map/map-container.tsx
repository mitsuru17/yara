"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import L from "leaflet";
import {
  LeafletContext,
  createLeafletContext,
  type LeafletContextInterface,
} from "@react-leaflet/core";

// Replacement for react-leaflet's MapContainer. Its v5 implementation creates the
// map in a ref callback but removes it in an effect cleanup, so when React re-runs
// effects (StrictMode, or <Activity> hiding/showing a cached route) children get a
// destroyed map with no panes. Here creation and removal live in the same effect.
export function MapContainer({
  center,
  zoom,
  className,
  children,
  ...options
}: L.MapOptions & {
  center: L.LatLngExpression;
  zoom: number;
  className?: string;
  children?: ReactNode;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<LeafletContextInterface | null>(null);

  useEffect(() => {
    const map = new L.Map(nodeRef.current!, options);
    map.setView(center, zoom);
    setContext(createLeafletContext(map));
    return () => {
      setContext(null);
      map.remove();
    };
    // Initial view/options only, like react-leaflet's MapContainer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={nodeRef} className={className}>
      {context && <LeafletContext value={context}>{children}</LeafletContext>}
    </div>
  );
}
