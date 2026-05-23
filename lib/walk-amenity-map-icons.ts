import type { Map as MapboxMap } from "mapbox-gl";
import { categoryEmoji } from "./walk-amenity-emoji";
import { WALK_CATEGORIES, type WalkCategoryKey } from "./walkscore-config";

/** Marker bitmap size (display ≈ size × icon-size on map). */
const MARKER_PX = 52;

function emojiMarkerSvg(category: WalkCategoryKey): string {
  const emoji = categoryEmoji(category);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_PX}" height="${MARKER_PX}" viewBox="0 0 ${MARKER_PX} ${MARKER_PX}">
  <text x="26" y="36" text-anchor="middle" font-size="34" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
</svg>`;
}

function loadOneImage(map: MapboxMap, category: WalkCategoryKey): Promise<void> {
  const id = `walk-amenity-${category}`;
  if (map.hasImage(id)) {
    map.removeImage(id);
  }

  return new Promise((resolve, reject) => {
    const img = new Image(MARKER_PX * 2, MARKER_PX * 2);
    img.onload = () => {
      if (!map.hasImage(id)) {
        map.addImage(id, img, { pixelRatio: 2 });
      }
      resolve();
    };
    img.onerror = () => reject(new Error(`Failed to load icon: ${category}`));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(emojiMarkerSvg(category))}`;
  });
}

/** Register emoji category marker images on the Mapbox map. */
export async function loadWalkAmenityMapImages(map: MapboxMap): Promise<void> {
  await Promise.all(
    WALK_CATEGORIES.map((cat) => loadOneImage(map, cat.key)),
  );
}
