"use client";

import { useEffect, useMemo, useState } from "react";
import { Layer, Source, useMap } from "react-map-gl";
import type { GeoJSONSource, MapLayerMouseEvent } from "mapbox-gl";
import type { Feature, Point } from "geojson";
import {
  amenityKey,
  WALK_AMENITY_CLUSTER_COUNT_LAYER_ID,
  WALK_AMENITY_CLUSTER_LAYER_ID,
  WALK_AMENITY_SOURCE_ID,
  WALK_AMENITY_UNCLUSTERED_LAYER_ID,
  amenitiesToFeatureCollection,
} from "@/lib/walk-amenity-geojson";
import { loadWalkAmenityMapImages } from "@/lib/walk-amenity-map-icons";
import type { WalkScoreAmenity } from "@/lib/walkscore-types";

const CLUSTER_COLOR = "#64748b";

interface WalkAmenityClusterLayerProps {
  amenities: WalkScoreAmenity[];
  onAmenityClick: (amenity: WalkScoreAmenity) => void;
  onHoverAmenity: (amenity: WalkScoreAmenity | null) => void;
}

export function WalkAmenityClusterLayer({
  amenities,
  onAmenityClick,
  onHoverAmenity,
}: WalkAmenityClusterLayerProps) {
  const { current: mapRef } = useMap();
  const [imagesReady, setImagesReady] = useState(false);

  const geojson = useMemo(
    () => amenitiesToFeatureCollection(amenities),
    [amenities],
  );

  const amenityByKey = useMemo(() => {
    const map = new Map<string, WalkScoreAmenity>();
    for (const a of amenities) {
      map.set(amenityKey(a), a);
    }
    return map;
  }, [amenities]);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    let cancelled = false;
    setImagesReady(false);

    void loadWalkAmenityMapImages(map)
      .then(() => {
        if (!cancelled) setImagesReady(true);
      })
      .catch(() => {
        if (!cancelled) setImagesReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [mapRef, amenities.length]);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || amenities.length === 0) return;

    const resolveAmenity = (feature: Feature): WalkScoreAmenity | null => {
      const key = feature.properties?.amenityKey;
      if (typeof key !== "string") return null;
      return amenityByKey.get(key) ?? null;
    };

    const onClusterClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature?.geometry || feature.geometry.type !== "Point") return;

      const clusterId = feature.properties?.cluster_id;
      if (clusterId == null) return;

      const source = map.getSource(WALK_AMENITY_SOURCE_ID) as GeoJSONSource;
      source.getClusterExpansionZoom(
        clusterId as number,
        (err, zoom) => {
          if (err) return;
          const coordinates = (feature.geometry as Point).coordinates as [
            number,
            number,
          ];
          map.easeTo({
            center: coordinates,
            zoom: zoom ?? map.getZoom() + 2,
            duration: 500,
          });
        },
      );
    };

    const onPointClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const amenity = resolveAmenity(feature);
      if (amenity) onAmenityClick(amenity);
    };

    const onPointEnter = (e: MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = "pointer";
      const amenity = e.features?.[0] ? resolveAmenity(e.features[0]) : null;
      onHoverAmenity(amenity);
    };

    const onPointLeave = () => {
      map.getCanvas().style.cursor = "";
      onHoverAmenity(null);
    };

    const onClusterEnter = () => {
      map.getCanvas().style.cursor = "pointer";
      onHoverAmenity(null);
    };

    const onClusterLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", WALK_AMENITY_CLUSTER_LAYER_ID, onClusterClick);
    map.on("click", WALK_AMENITY_UNCLUSTERED_LAYER_ID, onPointClick);
    map.on("mouseenter", WALK_AMENITY_UNCLUSTERED_LAYER_ID, onPointEnter);
    map.on("mouseleave", WALK_AMENITY_UNCLUSTERED_LAYER_ID, onPointLeave);
    map.on("mouseenter", WALK_AMENITY_CLUSTER_LAYER_ID, onClusterEnter);
    map.on("mouseleave", WALK_AMENITY_CLUSTER_LAYER_ID, onClusterLeave);

    return () => {
      map.off("click", WALK_AMENITY_CLUSTER_LAYER_ID, onClusterClick);
      map.off("click", WALK_AMENITY_UNCLUSTERED_LAYER_ID, onPointClick);
      map.off("mouseenter", WALK_AMENITY_UNCLUSTERED_LAYER_ID, onPointEnter);
      map.off("mouseleave", WALK_AMENITY_UNCLUSTERED_LAYER_ID, onPointLeave);
      map.off("mouseenter", WALK_AMENITY_CLUSTER_LAYER_ID, onClusterEnter);
      map.off("mouseleave", WALK_AMENITY_CLUSTER_LAYER_ID, onClusterLeave);
      map.getCanvas().style.cursor = "";
    };
  }, [mapRef, amenities, amenityByKey, onAmenityClick, onHoverAmenity]);

  if (amenities.length === 0) return null;

  return (
    <Source
      id={WALK_AMENITY_SOURCE_ID}
      type="geojson"
      data={geojson}
      cluster
      clusterMaxZoom={16}
      clusterRadius={48}
    >
      <Layer
        id={WALK_AMENITY_CLUSTER_LAYER_ID}
        type="circle"
        filter={["has", "point_count"]}
        paint={{
          "circle-color": CLUSTER_COLOR,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            5,
            22,
            12,
            26,
            24,
            30,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.95,
        }}
      />
      <Layer
        id={WALK_AMENITY_CLUSTER_COUNT_LAYER_ID}
        type="symbol"
        filter={["has", "point_count"]}
        layout={{
          "text-field": ["get", "point_count"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        }}
        paint={{
          "text-color": "#ffffff",
        }}
      />
      {imagesReady && (
        <Layer
          id={WALK_AMENITY_UNCLUSTERED_LAYER_ID}
          type="symbol"
          filter={["!", ["has", "point_count"]]}
          layout={{
            "icon-image": [
              "concat",
              "walk-amenity-",
              ["get", "category"],
            ],
            "icon-size": 1,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          }}
        />
      )}
    </Source>
  );
}
