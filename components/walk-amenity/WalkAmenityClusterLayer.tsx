"use client";

import { useEffect, useMemo, useState } from "react";
import { Layer, Source, useMap } from "react-map-gl";
import type { GeoJSONSource, MapLayerMouseEvent } from "mapbox-gl";
import type { Feature, Point } from "geojson";
import {
  amenityKey,
  WALK_AMENITY_CLUSTER_COUNT_LAYER_ID,
  WALK_AMENITY_CLUSTER_LAYER_ID,
  WALK_AMENITY_ICON_SIZE,
  WALK_AMENITY_SOURCE_ID,
  WALK_AMENITY_UNCLUSTERED_LAYER_ID,
  WALK_CLUSTER_EXPAND_ZOOM_BOOST,
  WALK_CLUSTER_MAX_ZOOM,
  WALK_CLUSTER_RADIUS,
  amenitiesToFeatureCollection,
} from "@/lib/walk-amenity-geojson";
import { loadWalkAmenityMapImages } from "@/lib/walk-amenity-map-icons";
import type { WalkScoreAmenity } from "@/lib/walkscore-types";

interface WalkAmenityClusterLayerProps {
  amenities: WalkScoreAmenity[];
  relevantOnly: boolean;
  relevantKeys: Set<string>;
  onAmenityClick: (amenity: WalkScoreAmenity) => void;
  onHoverAmenity: (amenity: WalkScoreAmenity | null) => void;
}

export function WalkAmenityClusterLayer({
  amenities,
  relevantOnly,
  relevantKeys,
  onAmenityClick,
  onHoverAmenity,
}: WalkAmenityClusterLayerProps) {
  const { current: mapRef } = useMap();
  const [imagesReady, setImagesReady] = useState(false);

  const sourceAmenities = useMemo(() => {
    if (!relevantOnly) return amenities;
    return amenities.filter((a) => relevantKeys.has(amenityKey(a)));
  }, [amenities, relevantOnly, relevantKeys]);

  const geojson = useMemo(
    () => amenitiesToFeatureCollection(sourceAmenities),
    [sourceAmenities],
  );

  const amenityByKey = useMemo(() => {
    const map = new Map<string, WalkScoreAmenity>();
    for (const a of sourceAmenities) {
      map.set(amenityKey(a), a);
    }
    return map;
  }, [sourceAmenities]);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const source = map.getSource(WALK_AMENITY_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(geojson);
  }, [mapRef, geojson]);

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
  }, [mapRef, sourceAmenities.length]);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || sourceAmenities.length === 0) return;

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
          const targetZoom = Math.min(
            (zoom ?? map.getZoom() + 2) + WALK_CLUSTER_EXPAND_ZOOM_BOOST,
            20,
          );
          map.easeTo({
            center: coordinates,
            zoom: targetZoom,
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
  }, [mapRef, sourceAmenities, amenityByKey, onAmenityClick, onHoverAmenity]);

  if (amenities.length === 0) return null;

  return (
    <Source
      id={WALK_AMENITY_SOURCE_ID}
      type="geojson"
      data={geojson}
      cluster
      clusterMaxZoom={WALK_CLUSTER_MAX_ZOOM}
      clusterRadius={WALK_CLUSTER_RADIUS}
    >
      <Layer
        id={WALK_AMENITY_CLUSTER_LAYER_ID}
        type="circle"
        filter={["has", "point_count"]}
        paint={{
          "circle-color": "#ffffff",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            16,
            4,
            20,
            10,
            24,
            20,
            28,
          ],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#0f4c5c",
          "circle-opacity": 0.97,
          "circle-blur": 0.05,
        }}
      />
      <Layer
        id={WALK_AMENITY_CLUSTER_COUNT_LAYER_ID}
        type="symbol"
        filter={["has", "point_count"]}
        layout={{
          "text-field": ["get", "point_count"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": [
            "step",
            ["get", "point_count"],
            12,
            10,
            13,
            25,
            14,
          ],
        }}
        paint={{
          "text-color": "#0f4c5c",
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
            "icon-size": relevantOnly
              ? WALK_AMENITY_ICON_SIZE * 1.15
              : WALK_AMENITY_ICON_SIZE,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          }}
          paint={{
            "icon-opacity": 1,
            "icon-opacity-transition": { duration: 200, delay: 0 },
          }}
        />
      )}
    </Source>
  );
}
