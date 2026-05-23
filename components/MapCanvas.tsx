"use client";

import Map, { Marker, NavigationControl } from "react-map-gl";
import type { MapLayerMouseEvent } from "react-map-gl";
import type { PublicProject } from "@/lib/projects";
import { projects } from "@/lib/projects";
import { ProjectPin } from "./ProjectPin";
import { NeighborhoodLayer } from "./NeighborhoodLayer";
import type { MapMode } from "./MapModeToggle";

import "mapbox-gl/dist/mapbox-gl.css";

const CLUJ_CENTER = { longitude: 23.5965, latitude: 46.7712, zoom: 13 };

export interface MapCanvasProps {
  token: string;
  mapMode: MapMode;
  selectedProjectId: string | null;
  selectedNeighborhoodId: string | null;
  visibleProjectIds: Set<string>;
  isProjectsMode: boolean;
  onMapClick: (e: MapLayerMouseEvent) => void;
  onMapMouseMove: (e: MapLayerMouseEvent) => void;
  onSelectProject: (project: PublicProject) => void;
}

export default function MapCanvas({
  token,
  mapMode,
  selectedProjectId,
  selectedNeighborhoodId,
  visibleProjectIds,
  isProjectsMode,
  onMapClick,
  onMapMouseMove,
  onSelectProject,
}: MapCanvasProps) {
  return (
    <Map
      mapboxAccessToken={token}
      initialViewState={CLUJ_CENTER}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
      onClick={onMapClick}
      onMouseMove={onMapMouseMove}
      interactiveLayerIds={
        mapMode === "neighborhoods" ? ["neighborhood-fill"] : undefined
      }
      attributionControl={true}
      reuseMaps
    >
      <NavigationControl position="top-left" showCompass={false} />

      <NeighborhoodLayer
        visible={mapMode === "neighborhoods"}
        selectedId={selectedNeighborhoodId}
      />

      {projects.map((project) => (
        <Marker
          key={project.id}
          longitude={project.coordinates[0]}
          latitude={project.coordinates[1]}
          anchor="center"
        >
          <ProjectPin
            project={project}
            isSelected={selectedProjectId === project.id}
            isVisible={isProjectsMode && visibleProjectIds.has(project.id)}
            onSelect={onSelectProject}
          />
        </Marker>
      ))}
    </Map>
  );
}
