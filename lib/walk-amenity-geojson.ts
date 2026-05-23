import type { WalkScoreAmenity } from "./walkscore-types";

export const WALK_AMENITY_SOURCE_ID = "walk-amenities";
export const WALK_AMENITY_CLUSTER_LAYER_ID = "walk-amenity-clusters";
export const WALK_AMENITY_CLUSTER_COUNT_LAYER_ID = "walk-amenity-cluster-count";
export const WALK_AMENITY_UNCLUSTERED_LAYER_ID = "walk-amenity-unclustered";

export const WALK_AMENITY_INTERACTIVE_LAYERS = [
  WALK_AMENITY_CLUSTER_LAYER_ID,
  WALK_AMENITY_UNCLUSTERED_LAYER_ID,
] as const;

export function amenityKey(a: WalkScoreAmenity): string {
  return `${a.category}-${a.lng}-${a.lat}-${a.name}`;
}

export function amenitiesToFeatureCollection(amenities: WalkScoreAmenity[]) {
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
      },
    })),
  };
}
