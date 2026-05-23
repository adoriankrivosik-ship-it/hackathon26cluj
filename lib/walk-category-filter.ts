import {
  WALK_CATEGORIES,
  type WalkCategoryDef,
  type WalkCategoryKey,
  type WalkSubcategoryKey,
} from "./walkscore-config";
import type { WalkScoreAmenity } from "./walkscore-types";

/** Categories shown on map without subcategory breakdown. */
export const WALK_CATEGORIES_WITHOUT_SUBS: WalkCategoryKey[] = [
  "transport",
  "parks",
];

export interface WalkMapVisibility {
  subcategories: Set<WalkSubcategoryKey>;
  leafCategories: Set<WalkCategoryKey>;
}

export function allWalkSubcategoryKeys(): WalkSubcategoryKey[] {
  const keys: WalkSubcategoryKey[] = [];
  for (const cat of WALK_CATEGORIES) {
    for (const sub of cat.subcategories ?? []) {
      keys.push(sub.key);
    }
  }
  return keys;
}

export function createDefaultWalkMapVisibility(): WalkMapVisibility {
  return {
    subcategories: new Set(allWalkSubcategoryKeys()),
    leafCategories: new Set(WALK_CATEGORIES_WITHOUT_SUBS),
  };
}

export function isAmenityVisibleOnMap(
  amenity: WalkScoreAmenity,
  visibility: WalkMapVisibility,
): boolean {
  if (amenity.subcategory) {
    return visibility.subcategories.has(amenity.subcategory);
  }
  return visibility.leafCategories.has(amenity.category);
}

export function filterAmenitiesForMap(
  amenities: WalkScoreAmenity[],
  visibility: WalkMapVisibility,
): WalkScoreAmenity[] {
  return amenities.filter((a) => isAmenityVisibleOnMap(a, visibility));
}

export function isWalkMapFilterActive(visibility: WalkMapVisibility): boolean {
  const def = createDefaultWalkMapVisibility();
  if (visibility.subcategories.size !== def.subcategories.size) return true;
  if (visibility.leafCategories.size !== def.leafCategories.size) return true;
  for (const k of Array.from(def.subcategories)) {
    if (!visibility.subcategories.has(k)) return true;
  }
  for (const k of Array.from(def.leafCategories)) {
    if (!visibility.leafCategories.has(k)) return true;
  }
  return false;
}

export function isCategoryFullyOnMap(
  cat: WalkCategoryDef,
  visibility: WalkMapVisibility,
): boolean {
  if (cat.subcategories?.length) {
    return cat.subcategories.every((s) =>
      visibility.subcategories.has(s.key),
    );
  }
  return visibility.leafCategories.has(cat.key);
}

export function isCategoryPartiallyOnMap(
  cat: WalkCategoryDef,
  visibility: WalkMapVisibility,
): boolean {
  if (!cat.subcategories?.length) return false;
  const on = cat.subcategories.filter((s) =>
    visibility.subcategories.has(s.key),
  ).length;
  return on > 0 && on < cat.subcategories.length;
}

export function toggleCategoryOnMap(
  cat: WalkCategoryDef,
  visibility: WalkMapVisibility,
): WalkMapVisibility {
  if (cat.subcategories?.length) {
    const allOn = isCategoryFullyOnMap(cat, visibility);
    const subcategories = new Set(visibility.subcategories);
    for (const sub of cat.subcategories) {
      if (allOn) subcategories.delete(sub.key);
      else subcategories.add(sub.key);
    }
    return { ...visibility, subcategories };
  }

  const leafCategories = new Set(visibility.leafCategories);
  if (leafCategories.has(cat.key)) leafCategories.delete(cat.key);
  else leafCategories.add(cat.key);
  return { ...visibility, leafCategories };
}

export function toggleSubcategoryOnMap(
  key: WalkSubcategoryKey,
  visibility: WalkMapVisibility,
): WalkMapVisibility {
  const subcategories = new Set(visibility.subcategories);
  if (subcategories.has(key)) subcategories.delete(key);
  else subcategories.add(key);
  return { ...visibility, subcategories };
}
