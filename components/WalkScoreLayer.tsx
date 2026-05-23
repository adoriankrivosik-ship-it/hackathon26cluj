"use client";

import { Marker } from "react-map-gl";
import type { IsochroneGeoJSON } from "@/lib/isochrone";
import { WALK_CATEGORIES } from "@/lib/walkscore-config";
import type { WalkScoreAmenity } from "@/lib/walkscore-types";
import { WalkingIsochroneLayer } from "./WalkingIsochroneLayer";

interface WalkScoreLayerProps {
  dropPin: [number, number] | null;
  isochrone: IsochroneGeoJSON | null;
  amenities: WalkScoreAmenity[];
}

function AmenityDot({ color }: { color: string }) {
  return (
    <span
      className="block h-2.5 w-2.5 rounded-full border border-white shadow-sm"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

function DropPinMarker() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center" aria-hidden="true">
      <span className="absolute h-6 w-6 rounded-full bg-primary/25" />
      <span className="relative h-3.5 w-3.5 rounded-full border-[3px] border-white bg-primary shadow-md" />
    </div>
  );
}

export function WalkScoreLayer({
  dropPin,
  isochrone,
  amenities,
}: WalkScoreLayerProps) {
  const colorByKey = Object.fromEntries(
    WALK_CATEGORIES.map((c) => [c.key, c.color]),
  ) as Record<string, string>;

  return (
    <>
      <WalkingIsochroneLayer geojson={isochrone} />

      {dropPin && (
        <Marker longitude={dropPin[0]} latitude={dropPin[1]} anchor="center">
          <DropPinMarker />
        </Marker>
      )}

      {amenities.map((a, i) => (
        <Marker
          key={`${a.category}-${a.lng}-${a.lat}-${i}`}
          longitude={a.lng}
          latitude={a.lat}
          anchor="center"
        >
          <AmenityDot color={colorByKey[a.category] ?? "#6b7280"} />
        </Marker>
      ))}
    </>
  );
}
