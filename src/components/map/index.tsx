"use client";

import dynamic from "next/dynamic";

function MapSkeleton() {
  return <div className="h-full w-full animate-pulse bg-slate-100" />;
}

export const IncidentsMap = dynamic(() => import("./incidents-map-inner"), {
  ssr: false,
  loading: MapSkeleton,
});

export const LocationPicker = dynamic(() => import("./location-picker-inner"), {
  ssr: false,
  loading: MapSkeleton,
});
