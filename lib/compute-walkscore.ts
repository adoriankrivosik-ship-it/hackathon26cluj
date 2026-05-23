import "server-only";

import { findCachedWalkPin, saveWalkPin } from "./walk-db";
import {
  bboxFromRing,
  extractIsochroneRing,
  fetchWalkingIsochrone,
} from "./isochrone";
import { fetchAmenitiesInBbox } from "./overpass";
import {
  computeOverallScore,
  computeScores,
  countByCategory,
  countBySubcategory,
  filterAmenitiesInPolygon,
} from "./walkscore";
import type { WalkScoreResult } from "./walkscore-types";

const OVERPASS_BUSY_MESSAGE =
  "Serviciul de date deschise e momentan ocupat, încearcă din nou";

export async function computeWalkScoreAt(
  lng: number,
  lat: number,
): Promise<WalkScoreResult> {
  const cached = await findCachedWalkPin(lng, lat);
  if (cached) return cached;

  const isochroneGeojson = await fetchWalkingIsochrone(lng, lat);
  const ring = extractIsochroneRing(isochroneGeojson);
  if (ring.length < 3) {
    throw new Error("Isochrone polygon invalid");
  }

  const bbox = bboxFromRing(ring);

  let amenitiesInBbox;
  try {
    amenitiesInBbox = await fetchAmenitiesInBbox(bbox, ring);
  } catch {
    throw new Error(OVERPASS_BUSY_MESSAGE);
  }

  const amenities = filterAmenitiesInPolygon(amenitiesInBbox, ring);
  const counts = countByCategory(amenities);
  const subcategoryCounts = countBySubcategory(amenities);
  const scores = computeScores(counts);
  const overallScore = computeOverallScore(scores);

  return saveWalkPin({
    lng,
    lat,
    isochroneGeojson,
    amenities,
    scores,
    subcategoryCounts,
    overallScore,
  });
}
