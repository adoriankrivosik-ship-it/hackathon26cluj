"use client";

import { getAmenityTypeLabel } from "@/lib/walkscore-config";
import type { WalkScoreAmenity } from "@/lib/walkscore-types";
import { WalkAmenityMarkerBadge } from "./WalkAmenityIcon";

interface WalkAmenityMarkerProps {
  amenity: WalkScoreAmenity;
  isOpen: boolean;
  onOpen: (amenity: WalkScoreAmenity) => void;
}

export function WalkAmenityMarker({
  amenity,
  isOpen,
  onOpen,
}: WalkAmenityMarkerProps) {
  const typeLabel = getAmenityTypeLabel(amenity);
  const ariaLabel = `${amenity.name}, ${typeLabel}`;

  return (
    <button
      type="button"
      className={`group relative flex items-center justify-center border-0 bg-transparent p-0 outline-none transition-transform duration-150 ease-out [@media(hover:hover)]:hover:scale-[1.2] focus-visible:scale-[1.2] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        isOpen ? "scale-[1.2] z-10" : ""
      }`}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onOpen(amenity);
      }}
    >
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-md opacity-0 transition-opacity duration-150 [@media(hover:hover)_and_(pointer:fine)]:group-hover:block [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
        role="tooltip"
      >
        {amenity.name}
      </span>
      <WalkAmenityMarkerBadge category={amenity.category} size={22} />
    </button>
  );
}
