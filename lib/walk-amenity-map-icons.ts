import type { Map as MapboxMap } from "mapbox-gl";
import {
  WALK_CATEGORIES,
  type WalkCategoryKey,
} from "./walkscore-config";

const ICON_PATHS: Record<WalkCategoryKey, string> = {
  education:
    '<path d="M4 10v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/><path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M7 13v3c0 1.5 2.2 3 5 3s5-1.5 5-3v-3"/>',
  health:
    '<path d="M12 6v12"/><path d="M6 12h12"/>',
  commercial:
    '<path d="M6 7h12l-1 11H7L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',
  culture:
    '<path d="M6 7h12"/><path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M7 11h10v8H7z"/><path d="M10 11V7M14 11V7"/>',
  transport:
    '<path d="M5 17h14"/><path d="M6 17V9l2-3h8l2 3v8"/><path d="M8 13h8"/>',
  parks:
    '<path d="M12 20V10"/><path d="M8 14c-2-3-2-6 0-8 2 2 2 5 0 8"/><path d="M16 14c2-3 2-6 0-8-2 2-2 5 0 8"/>',
  sport:
    '<path d="M6 9v6"/><path d="M18 9v6"/><path d="M6 12h12"/><path d="M9 9V6M15 9V6"/>',
  banking:
    '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/><path d="M7 14h4"/>',
  food:
    '<path d="M6 4v8"/><path d="M4 4v2"/><path d="M8 4v2"/><path d="M14 4v6a3 3 0 0 0 6 0V4"/><path d="M17 4v3"/>',
};

function iconSvg(category: WalkCategoryKey, color: string): string {
  const paths = ICON_PATHS[category];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
  <circle cx="22" cy="22" r="19" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
  <g transform="translate(22 22) scale(0.72) translate(-12 -12)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    ${paths}
  </g>
</svg>`;
}

function loadOneImage(
  map: MapboxMap,
  category: WalkCategoryKey,
  color: string,
): Promise<void> {
  const id = `walk-amenity-${category}`;
  if (map.hasImage(id)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const img = new Image(88, 88);
    img.onload = () => {
      if (!map.hasImage(id)) {
        map.addImage(id, img, { pixelRatio: 2 });
      }
      resolve();
    };
    img.onerror = () => reject(new Error(`Failed to load icon: ${category}`));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSvg(category, color))}`;
  });
}

/** Register category marker images on the Mapbox map (for symbol layer). */
export async function loadWalkAmenityMapImages(map: MapboxMap): Promise<void> {
  await Promise.all(
    WALK_CATEGORIES.map((cat) => loadOneImage(map, cat.key, cat.color)),
  );
}
