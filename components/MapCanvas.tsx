"use client";

import { useState } from "react";
import Map, { Marker, NavigationControl, Source, Layer } from "react-map-gl";
import type { MapLayerMouseEvent } from "react-map-gl";
import type { PublicProject } from "@/lib/projects";
import type { IsochroneGeoJSON } from "@/lib/isochrone";
import type { WalkScoreAmenity } from "@/lib/walkscore-types";
import { WALK_AMENITY_INTERACTIVE_LAYERS } from "@/lib/walk-amenity-geojson";
import { ProjectPin } from "./ProjectPin";
import { WalkScoreLayer } from "./WalkScoreLayer";
import type { MapMode } from "./MapModeToggle";

import "mapbox-gl/dist/mapbox-gl.css";

const CLUJ_CENTER = {
  longitude: 23.5965,
  latitude: 46.7712,
  zoom: 13,
};

export interface MapCanvasProps {
  token: string;
  mapMode: MapMode;
  projects: PublicProject[];
  selectedProjectId: string | null;
  visibleProjectIds: Set<string>;
  walkDropPin: [number, number] | null;
  walkIsochrone: IsochroneGeoJSON | null;
  walkAmenities: WalkScoreAmenity[];
  walkRelevantOnly: boolean;
  walkRelevantKeys: Set<string>;
  onMapClick: (e: MapLayerMouseEvent) => void;
  onSelectProject: (project: PublicProject) => void;
}

export default function MapCanvas({
  token,
  mapMode,
  projects,
  selectedProjectId,
  visibleProjectIds,
  walkDropPin,
  walkIsochrone,
  walkAmenities,
  walkRelevantOnly,
  walkRelevantKeys,
  onMapClick,
  onSelectProject,
}: MapCanvasProps) {
  const [viewState, setViewState] = useState(CLUJ_CENTER);
  const isProjectsMode = mapMode === "projects";

  const handleMapClick = (e: MapLayerMouseEvent) => {
    if (!isProjectsMode) {
      const map = e.target;
      const hitAmenity = map.queryRenderedFeatures(e.point, {
        layers: [...WALK_AMENITY_INTERACTIVE_LAYERS],
      });
      if (hitAmenity.length > 0) return;
    }
    onMapClick(e);
  };

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapboxAccessToken={token}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
      onClick={handleMapClick}
      cursor={isProjectsMode ? undefined : "crosshair"}
      attributionControl={true}
      reuseMaps
    >
      <NavigationControl position="top-left" showCompass={false} />

      {/* Strat profesional pentru cartiere */}
      <Source id="cartiere-cluj" type="geojson" data="/cartiere-cluj.geojson">
        {/* Umplere subtilă */}
        <Layer
          id="cartiere-fill"
          type="fill"
          paint={{
            "fill-color": "#6366f1",
            "fill-opacity": 0.03,
          }}
        />
        {/* Contur clar, dar fin */}
        <Layer
          id="cartiere-outline"
          type="line"
          paint={{
            "line-color": "#6366f1",
            "line-width": 1.5,
            "line-opacity": 0.4,
            "line-dasharray": [3, 2],
          }}
        />
        {/* Numele cartierelor */}
        <Layer
          id="cartiere-labels"
          type="symbol"
          layout={{
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-size": 11,
            "text-transform": "uppercase",
            "text-letter-spacing": 0.05,
          }}
          paint={{
            "text-color": "#4338ca",
            "text-halo-color": "rgba(255,255,255,0.9)",
            "text-halo-width": 2,
          }}
        />
      </Source>

      {!isProjectsMode && (
        <WalkScoreLayer
          dropPin={walkDropPin}
          isochrone={walkIsochrone}
          amenities={walkAmenities}
          relevantOnly={walkRelevantOnly}
          relevantKeys={walkRelevantKeys}
        />
      )}

      {isProjectsMode &&
        projects.map((project) => (
          <Marker
            key={project.id}
            longitude={project.coordinates[0]}
            latitude={project.coordinates[1]}
            anchor="center"
          >
            <ProjectPin
              project={project}
              isSelected={selectedProjectId === project.id}
              isVisible={visibleProjectIds.has(project.id)}
              onSelect={onSelectProject}
            />
          </Marker>
        ))}
    </Map>
  );
}
