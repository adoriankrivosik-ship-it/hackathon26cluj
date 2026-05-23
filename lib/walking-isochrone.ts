/** GeoJSON FeatureCollection returned by Mapbox Isochrone API (simplified). */
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

const WALK_MINUTES = 15;

/**
 * Fetches a walkable-area polygon for {minutes} on foot via Mapbox Isochrone API.
 * Uses the same public token as the map.
 */
export async function fetchWalkingIsochrone(
  lng: number,
  lat: number,
  accessToken: string,
  minutes: number = WALK_MINUTES,
): Promise<IsochroneGeoJSON> {
  const params = new URLSearchParams({
    contours_minutes: String(minutes),
    polygons: "true",
    access_token: accessToken,
  });

  const url = `https://api.mapbox.com/isochrone/v1/mapbox/walking/${lng},${lat}?${params}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Isochrone API ${res.status}: ${body}`);
  }

  return res.json() as Promise<IsochroneGeoJSON>;
}

export const WALK_REACH_MINUTES = WALK_MINUTES;
