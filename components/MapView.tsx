"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MapLayerMouseEvent } from "react-map-gl";
import type { PublicProject } from "@/lib/projects";
import { projects } from "@/lib/projects";
import type { ProjectStatus } from "@/lib/projects";
import {
  createDefaultFilters,
  filterProjects,
  hasActiveFilters,
  type CategoryFilter,
} from "@/lib/filters";
import {
  findNeighborhoodById,
  type Neighborhood,
} from "@/lib/neighborhoods";
import { ProjectDetailPanel } from "./ProjectDetailPanel";
import { FilterBar } from "./FilterBar";
import { StatusLegend } from "./StatusLegend";
import { MapModeToggle, type MapMode } from "./MapModeToggle";
import { NeighborhoodPanel } from "./NeighborhoodPanel";
import { ScoreLegend } from "./ScoreLegend";

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

export function MapView() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [mounted, setMounted] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>("projects");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(
    null,
  );
  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState<Neighborhood | null>(null);
  const [filters, setFilters] = useState(createDefaultFilters);

  const visibleIds = useMemo(() => {
    const visible = filterProjects(projects, filters);
    return new Set(visible.map((p) => p.id));
  }, [filters]);

  const visibleCount = visibleIds.size;
  const filtersActive = hasActiveFilters(filters);
  const isProjectsMode = mapMode === "projects";

  const handleSelectProject = useCallback((project: PublicProject) => {
    setSelectedProject(project);
    setSelectedNeighborhood(null);
  }, []);

  const handleCloseProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const handleCloseNeighborhood = useCallback(() => {
    setSelectedNeighborhood(null);
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

  const handleModeChange = useCallback((mode: MapMode) => {
    setMapMode(mode);
    setSelectedProject(null);
    setSelectedNeighborhood(null);
  }, []);

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (mapMode === "neighborhoods") {
        const feature = e.features?.find(
          (f) => f.layer?.id === "neighborhood-fill",
        );
        if (feature?.properties?.id) {
          const neighborhood = findNeighborhoodById(
            String(feature.properties.id),
          );
          if (neighborhood) {
            setSelectedNeighborhood(neighborhood);
            setSelectedProject(null);
          }
          return;
        }
        setSelectedNeighborhood(null);
        return;
      }
      handleCloseProject();
    },
    [mapMode, handleCloseProject],
  );

  const handleMapMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      const canvas = e.target.getCanvas();
      if (mapMode === "neighborhoods" && e.features?.some(
        (f) => f.layer?.id === "neighborhood-fill",
      )) {
        canvas.style.cursor = "pointer";
      } else {
        canvas.style.cursor = "";
      }
    },
    [mapMode],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedProject && !visibleIds.has(selectedProject.id)) {
      setSelectedProject(null);
    }
  }, [selectedProject, visibleIds]);

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
        mapMode={mapMode}
        selectedProjectId={selectedProject?.id ?? null}
        selectedNeighborhoodId={selectedNeighborhood?.id ?? null}
        visibleProjectIds={visibleIds}
        isProjectsMode={isProjectsMode}
        onMapClick={handleMapClick}
        onMapMouseMove={handleMapMouseMove}
        onSelectProject={handleSelectProject}
      />

      {/* Top overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-4 md:p-5 md:pl-[3.25rem]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
            <div className="pointer-events-auto shrink-0 rounded-xl bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm ring-1 ring-gray-200/80">
              <h1 className="text-base font-semibold text-primary md:text-lg">
                Hartă Proiecte Publice
              </h1>
              <p className="mt-0.5 text-xs text-gray-600 md:text-sm">
                Cluj-Napoca — transparență civică
              </p>
            </div>
            <MapModeToggle mode={mapMode} onChange={handleModeChange} />
          </div>
          {isProjectsMode && (
            <FilterBar
              filters={filters}
              onCategoryChange={handleCategoryChange}
              onDelayedOnlyChange={handleDelayedOnlyChange}
              visibleCount={visibleCount}
              totalCount={projects.length}
              showCount={filtersActive}
            />
          )}
        </div>
      </div>

      {/* Bottom-left legend — swaps by mode */}
      <div className="pointer-events-none absolute bottom-6 left-4 z-10 transition-opacity duration-panel md:bottom-8 md:left-5">
        {isProjectsMode ? (
          <StatusLegend
            activeStatuses={filters.activeStatuses}
            onToggleStatus={handleToggleStatus}
          />
        ) : (
          <ScoreLegend />
        )}
      </div>

      <ProjectDetailPanel
        project={isProjectsMode ? selectedProject : null}
        onClose={handleCloseProject}
      />
      <NeighborhoodPanel
        neighborhood={
          mapMode === "neighborhoods" ? selectedNeighborhood : null
        }
        onClose={handleCloseNeighborhood}
      />
    </div>
  );
}
