"use client";

import { getAmenityTypeLabel } from "@/lib/walkscore-config";
import type { WalkScoreAmenity } from "@/lib/walkscore-types";
import { WalkAmenityMarkerBadge } from "./WalkAmenityIcon";

interface WalkAmenityPopupProps {
  amenity: WalkScoreAmenity;
  onClose: () => void;
}

export function WalkAmenityPopupContent({
  amenity,
  onClose,
}: WalkAmenityPopupProps) {
  const typeLabel = getAmenityTypeLabel(amenity);
  const titleId = "walk-amenity-popup-title";

  return (
    <div
      className="relative min-w-[200px] max-w-[260px] p-3 pr-9"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby="walk-amenity-popup-type"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Închide"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="flex gap-3">
        <WalkAmenityMarkerBadge category={amenity.category} size={36} />
        <div className="min-w-0 flex-1 pt-0.5">
          <p
            id={titleId}
            className="text-sm font-semibold leading-snug text-gray-900"
          >
            {amenity.name}
          </p>
          <p
            id="walk-amenity-popup-type"
            className="mt-0.5 text-xs text-gray-500"
          >
            {typeLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
