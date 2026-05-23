"use client";

import { useMemo } from "react";
import { Layer, Source } from "react-map-gl";
import { closeRing } from "@/lib/geo";
import { neighborhoods } from "@/lib/neighborhoods";

interface NeighborhoodLayerProps {
  visible: boolean;
  selectedId: string | null;
}

/**
 * Mapbox fill + line layers for neighborhood score polygons.
 */
export function NeighborhoodLayer({
  visible,
  selectedId,
}: NeighborhoodLayerProps) {
  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: neighborhoods.map((n) => ({
        type: "Feature" as const,
        properties: {
          id: n.id,
          name: n.name,
          score: n.overallScore,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [closeRing(n.boundary)],
        },
      })),
    }),
    [],
  );

  const opacity = visible ? 0.5 : 0;
  const lineOpacity = visible ? 0.85 : 0;

  return (
    <Source id="neighborhoods" type="geojson" data={geojson}>
      <Layer
        id="neighborhood-fill"
        type="fill"
        paint={{
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "score"],
            0,
            "#ef4444",
            40,
            "#f59e0b",
            60,
            "#86efac",
            80,
            "#22c55e",
            100,
            "#16a34a",
          ],
          "fill-opacity": opacity,
          "fill-opacity-transition": { duration: 280, delay: 0 },
        }}
      />
      <Layer
        id="neighborhood-outline"
        type="line"
        paint={{
          "line-color": "#0f4c5c",
          "line-width": [
            "case",
            ["==", ["get", "id"], selectedId ?? ""],
            3,
            1.2,
          ],
          "line-opacity": lineOpacity,
          "line-opacity-transition": { duration: 280, delay: 0 },
        }}
      />
    </Source>
  );
}
