import { haversineMeters } from "./geo";
import { amenityKey } from "./walk-amenity-geojson";
import { WALK_CATEGORIES } from "./walkscore-config";
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

  for (const [category, items] of byCategory) {
    if (category === "transport") {
      takeNearest(items, 3, selected);
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

      for (const subItems of bySubcategory.values()) {
        takeNearest(subItems, Math.min(2, subItems.length), selected);
      }
      continue;
    }

    takeNearest(items, Math.min(2, items.length), selected);
  }

  return selected;
}
