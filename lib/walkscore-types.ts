import type {
  WalkCategoryKey,
  WalkSubcategoryKey,
} from "./walkscore-config";
import type { IsochroneGeoJSON } from "./isochrone";

export interface WalkScoreAmenity {
  category: WalkCategoryKey;
  subcategory?: WalkSubcategoryKey;
  name: string;
  lng: number;
  lat: number;
  /** Feature intersects isochrone (Overpass poly query); skip point filter. */
  matchedByPoly?: boolean;
}

export type WalkScoreScores = Record<WalkCategoryKey, number>;

export type WalkCategoryCounts = Record<WalkCategoryKey, number>;

export type WalkSubcategoryCounts = Partial<
  Record<WalkSubcategoryKey, number>
>;

export interface WalkScoreResult {
  id: string;
  lng: number;
  lat: number;
  isochroneGeojson: IsochroneGeoJSON;
  amenities: WalkScoreAmenity[];
  scores: WalkScoreScores;
  counts: WalkCategoryCounts;
  subcategoryCounts: WalkSubcategoryCounts;
  overallScore: number;
  cached: boolean;
  error?: string;
}
