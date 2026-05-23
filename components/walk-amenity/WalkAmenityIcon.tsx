"use client";

import {
  getCategoryDef,
  type WalkCategoryKey,
} from "@/lib/walkscore-config";

interface WalkAmenityIconProps {
  category: WalkCategoryKey;
  /** Icon size in px (SVG width/height). */
  size?: number;
  className?: string;
  /** White stroke on colored marker badge. */
  variant?: "brand" | "on-color";
}

function IconPaths({ category }: { category: WalkCategoryKey }) {
  switch (category) {
    case "education":
      return (
        <>
          <path d="M4 10v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
          <path d="M12 3 3 8l9 5 9-5-9-5Z" />
          <path d="M7 13v3c0 1.5 2.2 3 5 3s5-1.5 5-3v-3" />
        </>
      );
    case "health":
      return (
        <>
          <path d="M12 6v12" />
          <path d="M6 12h12" />
        </>
      );
    case "commercial":
      return (
        <>
          <path d="M6 7h12l-1 11H7L6 7Z" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        </>
      );
    case "culture":
      return (
        <>
          <path d="M6 7h12" />
          <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M7 11h10v8H7z" />
          <path d="M10 11V7M14 11V7" />
        </>
      );
    case "transport":
      return (
        <>
          <path d="M5 17h14" />
          <path d="M6 17V9l2-3h8l2 3v8" />
          <path d="M8 13h8" />
          <circle cx="8" cy="17" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="16" cy="17" r="1.5" fill="currentColor" stroke="none" />
        </>
      );
    case "parks":
      return (
        <>
          <path d="M12 20V10" />
          <path d="M8 14c-2-3-2-6 0-8 2 2 2 5 0 8" />
          <path d="M16 14c2-3 2-6 0-8-2 2-2 5 0 8" />
        </>
      );
    case "sport":
      return (
        <>
          <path d="M6 9v6" />
          <path d="M18 9v6" />
          <path d="M6 12h12" />
          <path d="M9 9V6M15 9V6" />
        </>
      );
    case "banking":
      return (
        <>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 14h4" />
        </>
      );
    case "food":
      return (
        <>
          <path d="M6 4v8" />
          <path d="M4 4v2" />
          <path d="M8 4v2" />
          <path d="M14 4v6a3 3 0 0 0 6 0V4" />
          <path d="M17 4v3" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="4" />;
  }
}

/** Inline SVG icon for a walkability category (stroke style). */
export function WalkAmenityIcon({
  category,
  size = 14,
  className = "",
  variant = "brand",
}: WalkAmenityIconProps) {
  const color =
    variant === "on-color" ? "#ffffff" : getCategoryDef(category).color;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      aria-hidden="true"
    >
      <IconPaths category={category} />
    </svg>
  );
}

/** Marker badge: colored circle with white icon (high contrast on isochrone). */
export function WalkAmenityMarkerBadge({
  category,
  size = 22,
}: {
  category: WalkCategoryKey;
  size?: number;
}) {
  const color = getCategoryDef(category).color;
  const iconSize = Math.round(size * 0.58);

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full ring-2 ring-white shadow-[0_1px_4px_rgba(15,23,42,0.45)]"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        color: "#ffffff",
      }}
      aria-hidden="true"
    >
      <WalkAmenityIcon category={category} size={iconSize} variant="on-color" />
    </span>
  );
}
