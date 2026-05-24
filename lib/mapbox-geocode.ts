/** Mapbox Geocoding API — client-safe (uses NEXT_PUBLIC_MAPBOX_TOKEN). */

export interface GeocodeFeature {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
}

interface GeocodeResponse {
  features?: GeocodeFeature[];
}

const CLUJ_PROXIMITY = "23.5965,46.7712";
/** Bbox around Cluj-Napoca (west,south,east,north). */
const CLUJ_BBOX = "23.45,46.70,23.80,46.86";

export async function searchAddresses(
  query: string,
  accessToken: string,
  signal?: AbortSignal,
): Promise<GeocodeFeature[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    access_token: accessToken,
    country: "ro",
    proximity: CLUJ_PROXIMITY,
    bbox: CLUJ_BBOX,
    language: "ro",
    types: "address,poi,place,locality,neighborhood",
    limit: "6",
    autocomplete: "true",
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?${params}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error("Căutarea adresei a eșuat.");
  }

  const data = (await res.json()) as GeocodeResponse;
  return data.features ?? [];
}
