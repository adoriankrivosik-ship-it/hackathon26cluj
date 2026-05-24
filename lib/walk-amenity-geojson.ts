import type { WalkScoreAmenity } from "./walkscore-types";

export const WALK_AMENITY_SOURCE_ID = "walk-amenities";
export const WALK_AMENITY_CLUSTER_LAYER_ID = "walk-amenity-clusters";
export const WALK_AMENITY_CLUSTER_COUNT_LAYER_ID = "walk-amenity-cluster-count";
export const WALK_AMENITY_UNCLUSTERED_LAYER_ID = "walk-amenity-unclustered";

/** Clusters break apart earlier when zooming in. */
export const WALK_CLUSTER_MAX_ZOOM = 20;
export const WALK_CLUSTER_RADIUS = 28;

/** Extra zoom past expansion threshold when clicking a cluster. */
export const WALK_CLUSTER_EXPAND_ZOOM_BOOST = 1.25;

/** Unclustered marker scale on map (+30% vs previous icon-size 1). */
export const WALK_AMENITY_ICON_SIZE = 1.3;

export const WALK_AMENITY_INTERACTIVE_LAYERS = [
  WALK_AMENITY_CLUSTER_LAYER_ID,
  WALK_AMENITY_UNCLUSTERED_LAYER_ID,
] as const;

export function amenityKey(a: WalkScoreAmenity): string {
  return `${a.category}-${a.lng}-${a.lat}-${a.name}`;
}

export function amenitiesToFeatureCollection(
  amenities: WalkScoreAmenity[],
  relevantKeys?: Set<string>,
) {
  return {
    type: "FeatureCollection" as const,
    features: amenities.map((a) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [a.lng, a.lat] as [number, number],
      },
      properties: {
        amenityKey: amenityKey(a),
        category: a.category,
        subcategory: a.subcategory ?? "",
        name: a.name,
        relevant: relevantKeys?.has(amenityKey(a)) ? 1 : 0,
      },
    })),
  };
}
