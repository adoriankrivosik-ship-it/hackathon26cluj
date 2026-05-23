"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MapLayerMouseEvent } from "react-map-gl";
import type { PublicProject, ProjectStatus } from "@/lib/projects";
import {
  createDefaultFilters,
  filterProjects,
  hasActiveFilters,
  type CategoryFilter,
} from "@/lib/filters";
import {
  fetchWalkingIsochrone,
  type IsochroneGeoJSON,
} from "@/lib/walking-isochrone";
import { useUserLocation } from "@/hooks/useUserLocation";
import { ProjectDetailPanel } from "./ProjectDetailPanel";
import { FilterBar } from "./FilterBar";
import { StatusLegend } from "./StatusLegend";
import { WalkReachLegend } from "./WalkReachLegend";

const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <p className="text-sm text-gray-500">Se încarcă harta…</p>
    </div>
  ),
});

function MapLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <p className="text-sm text-gray-500">Se încarcă harta…</p>
    </div>
  );
}

interface MapViewProps {
  projects: PublicProject[];
}

export function MapView({ projects }: MapViewProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [mounted, setMounted] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(
    null,
  );
  const [filters, setFilters] = useState(createDefaultFilters);
  const [isochrone, setIsochrone] = useState<IsochroneGeoJSON | null>(null);
  const [isochroneLoading, setIsochroneLoading] = useState(false);
  const [isochroneError, setIsochroneError] = useState<string | null>(null);

  const {
    position: userLocation,
    loading: locationLoading,
    error: locationError,
    refresh: refreshLocation,
  } = useUserLocation();

  const visibleIds = useMemo(() => {
    const visible = filterProjects(projects, filters);
    return new Set(visible.map((p) => p.id));
  }, [projects, filters]);

  const visibleCount = visibleIds.size;
  const filtersActive = hasActiveFilters(filters);

  const handleSelectProject = useCallback((project: PublicProject) => {
    setSelectedProject(project);
  }, []);

  const handleCloseProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const handleCategoryChange = useCallback((category: CategoryFilter) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  const handleDelayedOnlyChange = useCallback((delayedOnly: boolean) => {
    setFilters((prev) => ({ ...prev, delayedOnly }));
  }, []);

  const handleToggleStatus = useCallback((status: ProjectStatus) => {
    setFilters((prev) => {
      const nextStatuses = new Set(prev.activeStatuses);
      if (nextStatuses.has(status)) {
        nextStatuses.delete(status);
      } else {
        nextStatuses.add(status);
      }
      return { ...prev, activeStatuses: nextStatuses };
    });
  }, []);

  const handleMapClick = useCallback(() => {
    handleCloseProject();
  }, [handleCloseProject]);

  const handleRetryLocation = useCallback(() => {
    setIsochrone(null);
    setIsochroneError(null);
    refreshLocation();
  }, [refreshLocation]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedProject && !visibleIds.has(selectedProject.id)) {
      setSelectedProject(null);
    }
  }, [selectedProject, visibleIds]);

  // Build 15-minute walking polygon when we have location + token
  useEffect(() => {
    if (!userLocation || !token) return;

    let cancelled = false;
    setIsochroneLoading(true);
    setIsochroneError(null);

    fetchWalkingIsochrone(userLocation[0], userLocation[1], token)
      .then((data) => {
        if (!cancelled) setIsochrone(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setIsochroneError(
            err instanceof Error
              ? err.message
              : "Nu s-a putut calcula zona de mers pe jos.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsochroneLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userLocation, token]);

  const legendError = locationError ?? isochroneError;

  if (!mounted) {
    return <MapLoading />;
  }

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface px-6">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-amber-900">
            Token Mapbox lipsă
          </h1>
          <p className="mt-2 text-sm text-amber-800">
            Copiază <code className="rounded bg-amber-100 px-1">.env.local.example</code> în{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> și
            adaugă tokenul tău public Mapbox la{" "}
            <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      <MapCanvas
        token={token}
        projects={projects}
        selectedProjectId={selectedProject?.id ?? null}
        visibleProjectIds={visibleIds}
        userLocation={userLocation}
        userLocationLoading={locationLoading}
        isochrone={isochrone}
        onMapClick={handleMapClick}
        onSelectProject={handleSelectProject}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-4 md:p-5 md:pl-[3.25rem]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="pointer-events-auto shrink-0 rounded-xl bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm ring-1 ring-gray-200/80">
            <h1 className="text-base font-semibold text-primary md:text-lg">
              Hartă Proiecte Publice
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 md:text-sm">
              Cluj-Napoca — transparență civică
            </p>
          </div>
          <FilterBar
            filters={filters}
            onCategoryChange={handleCategoryChange}
            onDelayedOnlyChange={handleDelayedOnlyChange}
            visibleCount={visibleCount}
            totalCount={projects.length}
            showCount={filtersActive}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-4 z-10 flex flex-col gap-2 md:bottom-8 md:left-5">
        <WalkReachLegend
          loadingLocation={locationLoading}
          loadingIsochrone={isochroneLoading}
          error={legendError}
          onRetry={legendError ? handleRetryLocation : undefined}
        />
        <StatusLegend
          activeStatuses={filters.activeStatuses}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <ProjectDetailPanel
        project={selectedProject}
        onClose={handleCloseProject}
      />
    </div>
  );
}
