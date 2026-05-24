import { haversineMeters } from "./geo";
import { amenityKey } from "./walk-amenity-geojson";
import { WALK_CATEGORIES, type WalkCategoryKey } from "./walkscore-config";
import type { WalkScoreAmenity } from "./walkscore-types";

interface AmenityWithDistance {
  amenity: WalkScoreAmenity;
  distance: number;
  key: string;
}

function takeNearest(
  items: AmenityWithDistance[],
  count: number,
  selected: Set<string>,
): void {
  items.sort((a, b) => a.distance - b.distance);
  for (const item of items.slice(0, count)) {
    selected.add(item.key);
  }
}

/** Nearest amenities to the dropped pin for the “relevant only” map filter. */
export function getRelevantAmenityKeys(
  amenities: WalkScoreAmenity[],
  pinLng: number,
  pinLat: number,
  categoryWeights?: Partial<Record<WalkCategoryKey, number>>,
): Set<string> {
  const withDistance: AmenityWithDistance[] = amenities.map((amenity) => ({
    amenity,
    distance: haversineMeters(pinLng, pinLat, amenity.lng, amenity.lat),
    key: amenityKey(amenity),
  }));

  const byCategory = new Map<string, AmenityWithDistance[]>();
  for (const item of withDistance) {
    const group = byCategory.get(item.amenity.category) ?? [];
    group.push(item);
    byCategory.set(item.amenity.category, group);
  }

  const selected = new Set<string>();

  function pickCount(category: string, itemCount: number): number {
    if (categoryWeights) {
      const w = categoryWeights[category as WalkCategoryKey] ?? 0;
      if (w <= 0) return 0;
      return Math.max(1, Math.min(5, Math.ceil(w * 12)));
    }
    if (category === "transport") return Math.min(3, itemCount);
    return Math.min(2, itemCount);
  }

  for (const [category, items] of byCategory) {
    if (category === "transport") {
      takeNearest(items, pickCount(category, items.length), selected);
      continue;
    }

    const catDef = WALK_CATEGORIES.find((c) => c.key === category);
    if (catDef?.subcategories?.length) {
      const bySubcategory = new Map<string, AmenityWithDistance[]>();
      for (const item of items) {
        const subKey = item.amenity.subcategory ?? "_none";
        const group = bySubcategory.get(subKey) ?? [];
        group.push(item);
        bySubcategory.set(subKey, group);
      }

      const perSub = categoryWeights
        ? Math.max(1, Math.min(3, Math.ceil((categoryWeights[category as WalkCategoryKey] ?? 0) * 8)))
        : 2;

      for (const subItems of bySubcategory.values()) {
        takeNearest(subItems, Math.min(perSub, subItems.length), selected);
      }
      continue;
    }

    takeNearest(items, pickCount(category, items.length), selected);
  }

  return selected;
}
