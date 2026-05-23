"use client";

import { useEffect, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import type { MapLayerMouseEvent } from "react-map-gl";
import type { PublicProject } from "@/lib/projects";
import type { IsochroneGeoJSON } from "@/lib/walking-isochrone";
import { ProjectPin } from "./ProjectPin";
import { UserLocationMarker } from "./UserLocationMarker";
import { WalkingIsochroneLayer } from "./WalkingIsochroneLayer";

import "mapbox-gl/dist/mapbox-gl.css";

const CLUJ_CENTER = {
  longitude: 23.5965,
  latitude: 46.7712,
  zoom: 13,
};

export interface MapCanvasProps {
  token: string;
  projects: PublicProject[];
  selectedProjectId: string | null;
  visibleProjectIds: Set<string>;
  userLocation: [number, number] | null;
  userLocationLoading: boolean;
  isochrone: IsochroneGeoJSON | null;
  onMapClick: (e: MapLayerMouseEvent) => void;
  onSelectProject: (project: PublicProject) => void;
}

export default function MapCanvas({
  token,
  projects,
  selectedProjectId,
  visibleProjectIds,
  userLocation,
  userLocationLoading,
  isochrone,
  onMapClick,
  onSelectProject,
}: MapCanvasProps) {
  const [viewState, setViewState] = useState(CLUJ_CENTER);
  const [didFlyToUser, setDidFlyToUser] = useState(false);

  useEffect(() => {
    if (!userLocation || didFlyToUser) return;
    setViewState({
      longitude: userLocation[0],
      latitude: userLocation[1],
      zoom: 14,
    });
    setDidFlyToUser(true);
  }, [userLocation, didFlyToUser]);

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapboxAccessToken={token}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
      onClick={onMapClick}
      attributionControl={true}
      reuseMaps
    >
      <NavigationControl position="top-left" showCompass={false} />

      <WalkingIsochroneLayer geojson={isochrone} />

      {userLocation && (
        <Marker
          longitude={userLocation[0]}
          latitude={userLocation[1]}
          anchor="center"
        >
          <UserLocationMarker loading={userLocationLoading} />
        </Marker>
      )}

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
            isVisible={visibleProjectIds.has(project.id)}
            onSelect={onSelectProject}
          />
        </Marker>
      ))}
    </Map>
  );
}
