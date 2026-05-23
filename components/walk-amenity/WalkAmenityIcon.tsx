"use client";

import { categoryEmoji } from "@/lib/walk-amenity-emoji";
import type { WalkCategoryKey } from "@/lib/walkscore-config";

interface WalkAmenityIconProps {
  category: WalkCategoryKey;
  /** Emoji size in px. */
  size?: number;
  className?: string;
}

/** Plain emoji — no circle or background. */
export function WalkAmenityIcon({
  category,
  size = 36,
  className = "",
}: WalkAmenityIconProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center leading-none ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {categoryEmoji(category)}
    </span>
  );
}

/** Emoji for popups — same as map markers. */
export function WalkAmenityMarkerBadge({
  category,
  size = 36,
}: {
  category: WalkCategoryKey;
  size?: number;
}) {
  return <WalkAmenityIcon category={category} size={size} />;
}
