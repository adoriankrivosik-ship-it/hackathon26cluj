import "server-only";

import { getDatabase } from "./db";
import type { IsochroneGeoJSON } from "./isochrone";
import { WALK_CACHE_RADIUS_M } from "./walkscore-config";
import {
  countByCategory,
  countBySubcategory,
} from "./walkscore";
import type {
  WalkScoreAmenity,
  WalkScoreResult,
  WalkScoreScores,
  WalkSubcategoryCounts,
} from "./walkscore-types";

interface WalkPinRow {
  id: string;
  lng: number;
  lat: number;
  isochrone_geojson: string;
  amenities_json: string;
  scores_json: string;
  overall_score: number;
  created_at: string;
}

function haversineMeters(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function countsFromAmenities(amenities: WalkScoreAmenity[]) {
  return {
    counts: countByCategory(amenities),
    subcategoryCounts: countBySubcategory(amenities),
  };
}

function rowToResult(row: WalkPinRow, cached: boolean): WalkScoreResult {
  const scores = JSON.parse(row.scores_json) as WalkScoreScores;
  const amenities = JSON.parse(row.amenities_json) as WalkScoreAmenity[];
  const { counts, subcategoryCounts } = countsFromAmenities(amenities);

  return {
    id: row.id,
    lng: row.lng,
    lat: row.lat,
    isochroneGeojson: JSON.parse(
      row.isochrone_geojson,
    ) as IsochroneGeoJSON,
    amenities,
    scores,
    counts,
    subcategoryCounts,
    overallScore: row.overall_score,
    cached,
  };
}

export async function findCachedWalkPin(
  lng: number,
  lat: number,
): Promise<WalkScoreResult | null> {
  const db = await getDatabase();
  const { results } = await db
    .prepare("SELECT * FROM walk_pins")
    .all<WalkPinRow>();

  let best: WalkPinRow | null = null;
  let bestDist = WALK_CACHE_RADIUS_M + 1;

  for (const row of results ?? []) {
    const d = haversineMeters(lng, lat, row.lng, row.lat);
    if (d <= WALK_CACHE_RADIUS_M && d < bestDist) {
      best = row;
      bestDist = d;
    }
  }

  return best ? rowToResult(best, true) : null;
}

export async function saveWalkPin(input: {
  lng: number;
  lat: number;
  isochroneGeojson: IsochroneGeoJSON;
  amenities: WalkScoreAmenity[];
  scores: WalkScoreScores;
  subcategoryCounts: WalkSubcategoryCounts;
  overallScore: number;
}): Promise<WalkScoreResult> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO walk_pins (
        id, lng, lat, isochrone_geojson, amenities_json, scores_json,
        overall_score, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.lng,
      input.lat,
      JSON.stringify(input.isochroneGeojson),
      JSON.stringify(input.amenities),
      JSON.stringify(input.scores),
      input.overallScore,
      createdAt,
    )
    .run();

  const { counts } = countsFromAmenities(input.amenities);

  return {
    id,
    lng: input.lng,
    lat: input.lat,
    isochroneGeojson: input.isochroneGeojson,
    amenities: input.amenities,
    scores: input.scores,
    counts,
    subcategoryCounts: input.subcategoryCounts,
    overallScore: input.overallScore,
    cached: false,
  };
}
