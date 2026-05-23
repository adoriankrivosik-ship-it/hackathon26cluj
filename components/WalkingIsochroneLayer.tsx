"use client";

import { Layer, Source } from "react-map-gl";
import type { IsochroneGeoJSON } from "@/lib/isochrone";

interface WalkingIsochroneLayerProps {
  geojson: IsochroneGeoJSON | null;
}

/** Semi-transparent polygon: area reachable on foot in ~15 minutes. */
export function WalkingIsochroneLayer({ geojson }: WalkingIsochroneLayerProps) {
  if (!geojson || geojson.features.length === 0) return null;

  return (
    <Source id="walk-isochrone" type="geojson" data={geojson}>
      <Layer
        id="walk-isochrone-fill"
        type="fill"
        paint={{
          "fill-color": "#0f4c5c",
          "fill-opacity": 0.22,
        }}
      />
      <Layer
        id="walk-isochrone-outline"
        type="line"
        paint={{
          "line-color": "#0f4c5c",
          "line-width": 2,
          "line-opacity": 0.75,
        }}
      />
    </Source>
  );
}
