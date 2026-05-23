import "server-only";



import type { WalkCategoryKey, WalkSubcategoryKey } from "./walkscore-config";

import {

  OVERPASS_TIMEOUT_MS,

  subcategoryDefaultName,

} from "./walkscore-config";

import type { WalkScoreAmenity } from "./walkscore-types";

import type { BBox } from "./isochrone";



const OVERPASS_ENDPOINTS = [

  "https://overpass-api.de/api/interpreter",

  "https://overpass.kumi.systems/api/interpreter",

  "https://overpass.osm.ch/api/interpreter",

] as const;



const OVERPASS_USER_AGENT = "HartaProiecteCluj/1.0";



/** Backoff before retries 2 and 3 on the same mirror (ms). */

const RETRY_DELAYS_MS = [1000, 2000];



interface OverpassElement {

  type: string;

  id: number;

  lat?: number;

  lon?: number;

  center?: { lat: number; lon: number };

  tags?: Record<string, string>;

}



interface OverpassResponse {

  elements: OverpassElement[];

}



interface AmenityClassification {

  category: WalkCategoryKey;

  subcategory?: WalkSubcategoryKey;

}



function sleep(ms: number): Promise<void> {

  return new Promise((resolve) => setTimeout(resolve, ms));

}



/** Overpass `poly:"lat lon ..."` — ring is [lng, lat][]. */

function ringToOverpassPoly(ring: [number, number][]): string {

  if (ring.length < 3) return "";



  const first = ring[0];

  const last = ring[ring.length - 1];

  const closed =

    first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first];



  const coords = closed.map(([lng, lat]) => `${lat} ${lng}`).join(" ");

  return `poly:"${coords}"`;

}



/** OSM tag selectors — each becomes node/way/relation inside the search area. */

const OSM_SELECTORS = [

  '["amenity"="kindergarten"]',

  '["amenity"="school"]',

  '["amenity"="university"]',

  '["amenity"="college"]',

  '["amenity"="pharmacy"]',

  '["amenity"="clinic"]',

  '["amenity"="doctors"]',

  '["amenity"="hospital"]',

  '["amenity"="dentist"]',

  '["shop"="convenience"]',

  '["shop"="supermarket"]',

  '["amenity"="library"]',

  '["tourism"="museum"]',

  '["amenity"="theatre"]',

  '["amenity"="cinema"]',

  '["amenity"="arts_centre"]',

  '["highway"="bus_stop"]',

  '["railway"="tram_stop"]',

  '["public_transport"="platform"]',

  '["leisure"="park"]',

  '["leisure"="garden"]',

  '["landuse"="recreation_ground"]',

  '["leisure"="fitness_centre"]',

  '["leisure"="sports_centre"]',

  '["leisure"="pitch"]',

] as const;



function selectorQueries(selector: string, area: string): string {

  return `

  node${selector}(${area});

  way${selector}(${area});

  relation${selector}(${area});`;

}



function buildOverpassQuery(

  bbox: BBox,

  ring: [number, number][],

): string {

  const { south, west, north, east } = bbox;

  const box = `${south},${west},${north},${east}`;

  const poly = ringToOverpassPoly(ring);

  const area = poly || box;

  const filters = OSM_SELECTORS.map((s) => selectorQueries(s, area)).join("");



  return `

[out:json][timeout:25];

(

${filters}

);

out center tags;

`;

}



function categorizeElement(tags: Record<string, string>): AmenityClassification | null {

  if (tags.amenity === "kindergarten") {

    return { category: "education", subcategory: "kindergarten" };

  }

  if (tags.amenity === "school") {

    return { category: "education", subcategory: "school" };

  }

  if (tags.amenity === "university" || tags.amenity === "college") {

    return { category: "education", subcategory: "university" };

  }



  if (tags.amenity === "pharmacy") {

    return { category: "health", subcategory: "pharmacy" };

  }

  if (tags.amenity === "clinic" || tags.amenity === "doctors") {

    return { category: "health", subcategory: "clinic_doctors" };

  }

  if (tags.amenity === "hospital") {

    return { category: "health", subcategory: "hospital" };

  }

  if (tags.amenity === "dentist") {

    return { category: "health", subcategory: "dentist" };

  }



  if (tags.shop === "convenience") {

    return { category: "commercial", subcategory: "convenience" };

  }

  if (tags.shop === "supermarket") {

    return { category: "commercial", subcategory: "supermarket" };

  }



  if (tags.amenity === "library") {

    return { category: "culture", subcategory: "library" };

  }

  if (tags.tourism === "museum") {

    return { category: "culture", subcategory: "museum" };

  }

  if (tags.amenity === "theatre") {

    return { category: "culture", subcategory: "theatre" };

  }

  if (tags.amenity === "cinema") {

    return { category: "culture", subcategory: "cinema" };

  }

  if (tags.amenity === "arts_centre") {

    return { category: "culture", subcategory: "arts_centre" };

  }



  if (

    tags.highway === "bus_stop" ||

    tags.railway === "tram_stop" ||

    tags.public_transport === "platform"

  ) {

    return { category: "transport" };

  }



  if (

    tags.leisure === "park" ||

    tags.leisure === "garden" ||

    tags.landuse === "recreation_ground"

  ) {

    return { category: "parks" };

  }



  if (tags.leisure === "fitness_centre") {

    return { category: "sport", subcategory: "fitness_centre" };

  }

  if (tags.leisure === "sports_centre") {

    return { category: "sport", subcategory: "sports_centre" };

  }

  if (tags.leisure === "pitch") {

    return { category: "sport", subcategory: "pitch" };

  }



  return null;

}



const CATEGORY_DEFAULT_NAMES: Partial<Record<WalkCategoryKey, string>> = {
  transport: "Stație transport",
  parks: "Parc / spațiu verde",
};

function elementName(
  tags: Record<string, string>,
  classification: AmenityClassification,
): string {
  const named = tags.name ?? tags["name:ro"] ?? tags.operator;
  if (named) return named;
  if (classification.subcategory) {
    return subcategoryDefaultName(classification.subcategory);
  }
  return (
    CATEGORY_DEFAULT_NAMES[classification.category] ?? "Facilitate"
  );
}



function elementCoordinates(

  el: OverpassElement,

): { lat: number; lon: number } | null {

  if (el.lat != null && el.lon != null) {

    return { lat: el.lat, lon: el.lon };

  }

  if (el.center?.lat != null && el.center?.lon != null) {

    return { lat: el.center.lat, lon: el.center.lon };

  }

  return null;

}



function parseAmenities(

  data: OverpassResponse,

  queryFromPoly: boolean,

): WalkScoreAmenity[] {

  const amenities: WalkScoreAmenity[] = [];

  const seen = new Set<string>();



  for (const el of data.elements ?? []) {

    if (!el.tags) continue;



    const classification = categorizeElement(el.tags);

    if (!classification) continue;



    const coords = elementCoordinates(el);

    if (!coords) continue;



    const dedupeKey = `${el.type}/${el.id}`;

    if (seen.has(dedupeKey)) continue;

    seen.add(dedupeKey);



    amenities.push({

      category: classification.category,

      ...(classification.subcategory

        ? { subcategory: classification.subcategory }

        : {}),

      name: elementName(el.tags, classification),

      lng: coords.lon,

      lat: coords.lat,

      ...(queryFromPoly ? { matchedByPoly: true as const } : {}),

    });

  }



  return amenities;

}



function isRetryableOverpassError(err: unknown): boolean {

  if (err instanceof Error && err.message === "OVERPASS_TIMEOUT") {

    return true;

  }

  if (err instanceof Error && err.message.startsWith("Overpass HTTP")) {

    const status = Number(err.message.replace("Overpass HTTP ", ""));

    if (status >= 500 || status === 429) return true;

    return false;

  }

  return true;

}



/** Single request to one mirror (10s timeout, required User-Agent). */

async function fetchOverpassOnce(

  endpoint: string,

  body: string,

): Promise<OverpassResponse> {

  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);



  try {

    const res = await fetch(endpoint, {

      method: "POST",

      headers: {

        "Content-Type": "application/x-www-form-urlencoded",

        "User-Agent": OVERPASS_USER_AGENT,

      },

      body,

      signal: controller.signal,

    });



    if (!res.ok) {

      throw new Error(`Overpass HTTP ${res.status}`);

    }



    return (await res.json()) as OverpassResponse;

  } catch (err) {

    if (err instanceof Error && err.name === "AbortError") {

      throw new Error("OVERPASS_TIMEOUT");

    }

    throw err;

  } finally {

    clearTimeout(timer);

  }

}



/**

 * One mirror: up to 3 attempts with 1s then 2s backoff between failures.

 */

async function fetchFromEndpoint(

  endpoint: string,

  body: string,

): Promise<OverpassResponse> {

  const maxAttempts = RETRY_DELAYS_MS.length + 1;

  let lastError: unknown;



  for (let attempt = 0; attempt < maxAttempts; attempt++) {

    try {

      return await fetchOverpassOnce(endpoint, body);

    } catch (err) {

      lastError = err;

      if (!isRetryableOverpassError(err)) {

        throw err;

      }

      if (attempt < RETRY_DELAYS_MS.length) {

        await sleep(RETRY_DELAYS_MS[attempt]);

      }

    }

  }



  throw lastError;

}



/**

 * Fetch amenities in bbox from OSM Overpass.

 * Tries mirrors in order; each mirror gets retries with exponential backoff.

 */

export async function fetchAmenitiesInBbox(

  bbox: BBox,

  ring: [number, number][],

): Promise<WalkScoreAmenity[]> {

  const queryFromPoly = ring.length >= 3;

  const body = `data=${encodeURIComponent(buildOverpassQuery(bbox, ring))}`;

  let lastError: unknown;



  for (const endpoint of OVERPASS_ENDPOINTS) {

    try {

      const data = await fetchFromEndpoint(endpoint, body);

      return parseAmenities(data, queryFromPoly);

    } catch (err) {

      lastError = err;

    }

  }



  if (lastError instanceof Error && lastError.message === "OVERPASS_TIMEOUT") {

    throw new Error("OVERPASS_TIMEOUT");

  }



  throw lastError instanceof Error

    ? lastError

    : new Error("OVERPASS_UNAVAILABLE");

}


