"use client";

import { useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import type { MapLayerMouseEvent } from "react-map-gl";
import type { PublicProject } from "@/lib/projects";
import type { IsochroneGeoJSON } from "@/lib/isochrone";
import type { WalkScoreAmenity } from "@/lib/walkscore-types";
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
  onMapClick,
  onSelectProject,
}: MapCanvasProps) {
  const [viewState, setViewState] = useState(CLUJ_CENTER);
  const isProjectsMode = mapMode === "projects";

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapboxAccessToken={token}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
      onClick={onMapClick}
      cursor={isProjectsMode ? undefined : "crosshair"}
      attributionControl={true}
      reuseMaps
    >
      <NavigationControl position="top-left" showCompass={false} />

      {!isProjectsMode && (
        <WalkScoreLayer
          dropPin={walkDropPin}
          isochrone={walkIsochrone}
          amenities={walkAmenities}
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
