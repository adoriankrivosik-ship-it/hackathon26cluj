import "server-only";

import { pointInPolygon } from "./geo";
import { WALK_CATEGORIES } from "./walkscore-config";
import type {
  WalkCategoryCounts,
  WalkScoreAmenity,
  WalkScoreScores,
  WalkSubcategoryCounts,
} from "./walkscore-types";

export function filterAmenitiesInPolygon(
  amenities: WalkScoreAmenity[],
  ring: [number, number][],
): WalkScoreAmenity[] {
  return amenities.filter((a) => {
    if (a.matchedByPoly) return true;
    return pointInPolygon([a.lng, a.lat], ring);
  });
}

export function countByCategory(
  amenities: WalkScoreAmenity[],
): WalkCategoryCounts {
  const counts = Object.fromEntries(
    WALK_CATEGORIES.map((c) => [c.key, 0]),
  ) as WalkCategoryCounts;

  for (const a of amenities) {
    counts[a.category] += 1;
  }

  return counts;
}

export function countBySubcategory(
  amenities: WalkScoreAmenity[],
): WalkSubcategoryCounts {
  const counts: WalkSubcategoryCounts = {};

  for (const a of amenities) {
    if (!a.subcategory) continue;
    counts[a.subcategory] = (counts[a.subcategory] ?? 0) + 1;
  }

  return counts;
}

export function scoreFromCount(count: number, cap: number): number {
  if (cap <= 0) return 0;
  return Math.min(100, Math.round((count / cap) * 100));
}

export function computeScores(counts: WalkCategoryCounts): WalkScoreScores {
  const scores = {} as WalkScoreScores;
  for (const cat of WALK_CATEGORIES) {
    scores[cat.key] = scoreFromCount(counts[cat.key], cat.countCap);
  }
  return scores;
}

/** Equal-weighted mean of category sub-scores. */
export function computeOverallScore(scores: WalkScoreScores): number {
  let sum = 0;
  for (const cat of WALK_CATEGORIES) {
    sum += scores[cat.key];
  }
  return Math.round(sum / WALK_CATEGORIES.length);
}
