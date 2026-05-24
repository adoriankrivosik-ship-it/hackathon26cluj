"use client";

import { useCallback, useEffect, useState } from "react";
import { Marker, Popup } from "react-map-gl";
import type { IsochroneGeoJSON } from "@/lib/isochrone";
import { amenityKey } from "@/lib/walk-amenity-geojson";
import type { WalkScoreAmenity } from "@/lib/walkscore-types";
import { WalkAmenityClusterLayer } from "./walk-amenity/WalkAmenityClusterLayer";
import { WalkAmenityPopupContent } from "./walk-amenity/WalkAmenityPopup";
import { WalkingIsochroneLayer } from "./WalkingIsochroneLayer";

interface WalkScoreLayerProps {
  dropPin: [number, number] | null;
  isochrone: IsochroneGeoJSON | null;
  amenities: WalkScoreAmenity[];
  relevantOnly: boolean;
  relevantKeys: Set<string>;
}

function DropPinMarker() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center" aria-hidden="true">
      <span className="absolute h-6 w-6 rounded-full bg-primary/25" />
      <span className="relative h-3.5 w-3.5 rounded-full border-[3px] border-white bg-primary shadow-md" />
    </div>
  );
}

export function WalkScoreLayer({
  dropPin,
  isochrone,
  amenities,
  relevantOnly,
  relevantKeys,
}: WalkScoreLayerProps) {
  const [openAmenityKey, setOpenAmenityKey] = useState<string | null>(null);
  const [hoverAmenity, setHoverAmenity] = useState<WalkScoreAmenity | null>(
    null,
  );

  const openAmenity =
    amenities.find((a) => amenityKey(a) === openAmenityKey) ?? null;

  const handleAmenityClick = useCallback((amenity: WalkScoreAmenity) => {
    const key = amenityKey(amenity);
    setOpenAmenityKey((prev) => (prev === key ? null : key));
    setHoverAmenity(null);
  }, []);

  const handleClosePopup = useCallback(() => {
    setOpenAmenityKey(null);
  }, []);

  useEffect(() => {
    setOpenAmenityKey(null);
    setHoverAmenity(null);
  }, [amenities, dropPin]);

  return (
    <>
      <WalkingIsochroneLayer geojson={isochrone} />

      <WalkAmenityClusterLayer
        amenities={amenities}
        relevantOnly={relevantOnly}
        relevantKeys={relevantKeys}
        onAmenityClick={handleAmenityClick}
        onHoverAmenity={setHoverAmenity}
      />

      {dropPin && (
        <Marker longitude={dropPin[0]} latitude={dropPin[1]} anchor="center">
          <DropPinMarker />
        </Marker>
      )}

      {hoverAmenity && !openAmenity && (
        <Popup
          longitude={hoverAmenity.lng}
          latitude={hoverAmenity.lat}
          anchor="bottom"
          offset={14}
          closeButton={false}
          closeOnClick={false}
          className="walk-amenity-hover-popup pointer-events-none"
        >
          <p className="px-2 py-1 text-xs font-medium text-gray-900">
            {hoverAmenity.name}
          </p>
        </Popup>
      )}

      {openAmenity && (
        <Popup
          longitude={openAmenity.lng}
          latitude={openAmenity.lat}
          anchor="bottom"
          offset={16}
          closeOnClick
          closeButton={false}
          onClose={handleClosePopup}
          className="walk-amenity-popup"
          maxWidth="280px"
        >
          <WalkAmenityPopupContent
            amenity={openAmenity}
            onClose={handleClosePopup}
          />
        </Popup>
      )}
    </>
  );
}
