"use client";

import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { MapView } from "@/components/MapView";

export default function HomePage() {
  return (
    <MapErrorBoundary>
      <MapView />
    </MapErrorBoundary>
  );
}
