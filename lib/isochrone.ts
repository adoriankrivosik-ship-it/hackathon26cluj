import "server-only";

import { WALK_ISOCHRONE_MINUTES } from "./walkscore-config";

export interface IsochroneGeoJSON {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    geometry: {
      type: "Polygon" | "MultiPolygon";
      coordinates: number[][][] | number[][][][];
    };
    properties?: Record<string, unknown>;
  }[];
}

export function getMapboxToken(): string {
  return (
    process.env.MAPBOX_ACCESS_TOKEN ??
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
    ""
  );
}

export async function fetchWalkingIsochrone(
  lng: number,
  lat: number,
  minutes: number = WALK_ISOCHRONE_MINUTES,
): Promise<IsochroneGeoJSON> {
  const token = getMapboxToken();
  if (!token) {
    throw new Error("Mapbox token missing");
  }

  const params = new URLSearchParams({
    contours_minutes: String(minutes),
    polygons: "true",
    access_token: token,
  });

  const url = `https://api.mapbox.com/isochrone/v1/mapbox/walking/${lng},${lat}?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Isochrone API ${res.status}: ${body}`);
  }

  return res.json() as Promise<IsochroneGeoJSON>;
}

/** Extract outer ring [lng, lat][] from isochrone GeoJSON. */
export function extractIsochroneRing(
  geojson: IsochroneGeoJSON,
): [number, number][] {
  const geom = geojson.features[0]?.geometry;
  if (!geom) return [];

  if (geom.type === "Polygon") {
    const ring = geom.coordinates[0] as [number, number][];
    return ring.map(([lng, lat]) => [lng, lat]);
  }

  const multi = geom.coordinates[0]?.[0] as [number, number][] | undefined;
  return multi?.map(([lng, lat]) => [lng, lat]) ?? [];
}

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export function bboxFromRing(ring: [number, number][]): BBox {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of ring) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return { south: minLat, west: minLng, north: maxLat, east: maxLng };
}
