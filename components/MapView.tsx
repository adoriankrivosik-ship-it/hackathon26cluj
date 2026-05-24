"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapLayerMouseEvent } from "react-map-gl";
import type { PublicProject, ProjectStatus } from "@/lib/projects";
import type { IsochroneGeoJSON } from "@/lib/isochrone";
import { distanceMeters } from "@/lib/pin-distance";
import type { DbSavedPin } from "@/lib/saved-pins-types";
import { getRelevantAmenityKeys } from "@/lib/walk-relevant-amenities";
import {
  createDefaultWalkMapVisibility,
  filterAmenitiesForMap,
  toggleCategoryOnMap,
  toggleSubcategoryOnMap,
  type WalkMapVisibility,
} from "@/lib/walk-category-filter";
import {
  WALK_CATEGORIES,
  type WalkCategoryKey,
  type WalkSubcategoryKey,
} from "@/lib/walkscore-config";
import type { WalkScoreResult } from "@/lib/walkscore-types";
import {
  createDefaultFilters,
  filterProjects,
  hasActiveFilters,
  type CategoryFilter,
} from "@/lib/filters";
import { ProjectDetailPanel } from "./ProjectDetailPanel";
import { FilterBar } from "./FilterBar";
import { StatusLegend } from "./StatusLegend";
import { MapModeToggle, type MapMode } from "./MapModeToggle";
import { WalkScorePanel } from "./WalkScorePanel";
import { WalkModeHint } from "./WalkModeHint";
import { SavedPinsDrawer } from "./SavedPinsDrawer";
import type { MapCanvasHandle } from "./MapCanvas";

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

interface CitizenSession {
  email: string;
  name: string;
}

interface MapViewProps {
  projects: PublicProject[];
  citizenUser?: CitizenSession | null;
}

export function MapView({ projects, citizenUser = null }: MapViewProps) {
  const mapRef = useRef<MapCanvasHandle>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [mounted, setMounted] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>("projects");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(
    null,
  );
  const [filters, setFilters] = useState(createDefaultFilters);

  const [walkDropPin, setWalkDropPin] = useState<[number, number] | null>(null);
  const [walkResult, setWalkResult] = useState<WalkScoreResult | null>(null);
  const [walkLoading, setWalkLoading] = useState(false);
  const [walkError, setWalkError] = useState<string | null>(null);
  const [walkMapVisibility, setWalkMapVisibility] =
    useState<WalkMapVisibility>(createDefaultWalkMapVisibility);
  const [walkRelevantOnly, setWalkRelevantOnly] = useState(false);

  const [savedPins, setSavedPins] = useState<DbSavedPin[]>([]);
  const [savedPinsLoading, setSavedPinsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savePinLoading, setSavePinLoading] = useState(false);
  const [pinToast, setPinToast] = useState<string | null>(null);

  const isCitizen = citizenUser !== null;

  const visibleIds = useMemo(() => {
    const visible = filterProjects(projects, filters);
    return new Set(visible.map((p) => p.id));
  }, [projects, filters]);

  const visibleCount = visibleIds.size;
  const filtersActive = hasActiveFilters(filters);
  const isProjectsMode = mapMode === "projects";

  const handleSelectProject = useCallback((project: PublicProject) => {
    setSelectedProject(project);
  }, []);

  const handleCloseProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const handleCloseWalkPanel = useCallback(() => {
    setWalkResult(null);
    setWalkError(null);
    setWalkLoading(false);
    setWalkDropPin(null);
    setWalkMapVisibility(createDefaultWalkMapVisibility());
    setWalkRelevantOnly(false);
  }, []);

  const handleToggleWalkCategoryOnMap = useCallback((key: WalkCategoryKey) => {
    const cat = WALK_CATEGORIES.find((c) => c.key === key);
    if (!cat) return;
    setWalkMapVisibility((prev) => toggleCategoryOnMap(cat, prev));
  }, []);

  const handleToggleWalkSubcategoryOnMap = useCallback(
    (key: WalkSubcategoryKey) => {
      setWalkMapVisibility((prev) => toggleSubcategoryOnMap(key, prev));
    },
    [],
  );

  const handleShowAllOnMap = useCallback(() => {
    setWalkMapVisibility(createDefaultWalkMapVisibility());
  }, []);

  const handleHideAllOnMap = useCallback(() => {
    setWalkMapVisibility({
      subcategories: new Set(),
      leafCategories: new Set(),
    });
  }, []);

  const loadSavedPins = useCallback(async () => {
    if (!isCitizen) return;
    setSavedPinsLoading(true);
    try {
      const res = await fetch("/api/pins/saved");
      if (res.ok) {
        const data = (await res.json()) as { pins: DbSavedPin[] };
        setSavedPins(data.pins ?? []);
      }
    } finally {
      setSavedPinsLoading(false);
    }
  }, [isCitizen]);

  useEffect(() => {
    void loadSavedPins();
  }, [loadSavedPins]);

  useEffect(() => {
    if (!pinToast) return;
    const id = setTimeout(() => setPinToast(null), 2500);
    return () => clearTimeout(id);
  }, [pinToast]);

  const matchingSavedPin = useMemo(() => {
    if (!walkDropPin || !isCitizen) return null;
    const [lng, lat] = walkDropPin;
    for (const pin of savedPins) {
      if (distanceMeters(lng, lat, pin.lng, pin.lat) <= 50) {
        return pin;
      }
    }
    return null;
  }, [walkDropPin, savedPins, isCitizen]);

  const handleToggleSavePin = useCallback(async () => {
    if (!isCitizen || !walkDropPin || !walkResult) return;
    setSavePinLoading(true);
    try {
      if (matchingSavedPin) {
        const res = await fetch("/api/pins/save", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: matchingSavedPin.id }),
        });
        if (res.ok) {
          setSavedPins((prev) =>
            prev.filter((p) => p.id !== matchingSavedPin.id),
          );
          setPinToast("Pin eliminat");
        }
      } else {
        const [lng, lat] = walkDropPin;
        const res = await fetch("/api/pins/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lng,
            lat,
            overall_score: walkResult.overallScore,
            scores_json: walkResult.scores,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { pin: DbSavedPin };
          setSavedPins((prev) => [data.pin, ...prev]);
          setPinToast("Pin salvat!");
        }
      }
    } finally {
      setSavePinLoading(false);
    }
  }, [isCitizen, walkDropPin, walkResult, matchingSavedPin]);

  const handleDeleteSavedPin = useCallback(
    async (id: string) => {
      const res = await fetch("/api/pins/save", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setSavedPins((prev) => prev.filter((p) => p.id !== id));
        setPinToast("Pin eliminat");
      }
    },
    [],
  );

  const handleModeChange = useCallback((mode: MapMode) => {
    setMapMode(mode);
    setSelectedProject(null);
    handleCloseWalkPanel();
  }, [handleCloseWalkPanel]);

  const fetchWalkScore = useCallback(async (lng: number, lat: number) => {
    setWalkLoading(true);
    setWalkError(null);
    setWalkResult(null);
    setWalkRelevantOnly(false);

    try {
      const res = await fetch(
        `/api/walkscore?lng=${encodeURIComponent(lng)}&lat=${encodeURIComponent(lat)}`,
      );
      const data = (await res.json()) as WalkScoreResult & { error?: string };

      if (!res.ok) {
        setWalkError(
          data.error ??
            "Serviciul de date deschise e momentan ocupat, încearcă din nou",
        );
        return;
      }

      setWalkResult(data);
      setWalkMapVisibility(createDefaultWalkMapVisibility());
    } catch {
      setWalkError(
        "Serviciul de date deschise e momentan ocupat, încearcă din nou",
      );
    } finally {
      setWalkLoading(false);
    }
  }, []);

  const handleSelectSavedPin = useCallback(
    (pin: DbSavedPin) => {
      setMapMode("walkscore");
      setSelectedProject(null);
      mapRef.current?.flyTo(pin.lng, pin.lat);
      setWalkDropPin([pin.lng, pin.lat]);
      void fetchWalkScore(pin.lng, pin.lat);
      setDrawerOpen(false);
    },
    [fetchWalkScore],
  );

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (mapMode === "walkscore") {
        const lng = e.lngLat.lng;
        const lat = e.lngLat.lat;
        setWalkDropPin([lng, lat]);
        void fetchWalkScore(lng, lat);
        return;
      }
      handleCloseProject();
    },
    [mapMode, fetchWalkScore, handleCloseProject],
  );

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedProject && !visibleIds.has(selectedProject.id)) {
      setSelectedProject(null);
    }
  }, [selectedProject, visibleIds]);

  const walkIsochrone: IsochroneGeoJSON | null =
    walkResult?.isochroneGeojson ?? null;
  const walkAmenitiesAll = walkResult?.amenities ?? [];
  const walkAmenities = useMemo(
    () => filterAmenitiesForMap(walkAmenitiesAll, walkMapVisibility),
    [walkAmenitiesAll, walkMapVisibility],
  );
  const walkRelevantKeys = useMemo(() => {
    if (!walkDropPin) return new Set<string>();
    return getRelevantAmenityKeys(
      walkAmenitiesAll,
      walkDropPin[0],
      walkDropPin[1],
    );
  }, [walkAmenitiesAll, walkDropPin]);

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
        ref={mapRef}
        token={token}
        mapMode={mapMode}
        projects={projects}
        selectedProjectId={selectedProject?.id ?? null}
        visibleProjectIds={visibleIds}
        walkDropPin={walkDropPin}
        walkIsochrone={walkIsochrone}
        walkAmenities={walkAmenities}
        walkRelevantOnly={walkRelevantOnly}
        walkRelevantKeys={walkRelevantKeys}
        onMapClick={handleMapClick}
        onSelectProject={handleSelectProject}
      />

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
              {isCitizen && (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-[#0D1B2A] transition-colors hover:border-[#F0A500] hover:text-[#F0A500]"
                >
                  <span aria-hidden="true">❤️</span>
                  Pinii mei
                </button>
              )}
              <Link
                href="/admin"
                className="mt-2 inline-flex items-center gap-1 rounded text-xs font-medium text-[#0D1B2A]/70 underline-offset-2 hover:text-[#F0A500] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A500]"
              >
                Panou admin
              </Link>
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

      {pinToast && (
        <div
          className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#0D1B2A] px-4 py-2 text-sm font-medium text-white shadow-lg md:bottom-8"
          role="status"
        >
          {pinToast}
        </div>
      )}

      {isCitizen && (
        <SavedPinsDrawer
          open={drawerOpen}
          pins={savedPins}
          loading={savedPinsLoading}
          onClose={() => setDrawerOpen(false)}
          onSelectPin={handleSelectSavedPin}
          onDeletePin={handleDeleteSavedPin}
        />
      )}

      <div className="pointer-events-none absolute bottom-6 left-4 z-10 flex flex-col gap-2 md:bottom-8 md:left-5">
        {isProjectsMode ? (
          <StatusLegend
            activeStatuses={filters.activeStatuses}
            onToggleStatus={handleToggleStatus}
          />
        ) : (
          <WalkModeHint />
        )}
      </div>

      <ProjectDetailPanel
        project={isProjectsMode ? selectedProject : null}
        onClose={handleCloseProject}
      />
      <WalkScorePanel
        result={!isProjectsMode ? walkResult : null}
        loading={!isProjectsMode && walkLoading}
        error={!isProjectsMode ? walkError : null}
        mapVisibility={walkMapVisibility}
        onToggleCategoryOnMap={handleToggleWalkCategoryOnMap}
        onToggleSubcategoryOnMap={handleToggleWalkSubcategoryOnMap}
        onShowAllOnMap={handleShowAllOnMap}
        onHideAllOnMap={handleHideAllOnMap}
        relevantOnly={walkRelevantOnly}
        onRelevantOnlyChange={setWalkRelevantOnly}
        visibleOnMapCount={walkAmenities.length}
        onClose={handleCloseWalkPanel}
        showSaveHeart={isCitizen}
        isSaved={matchingSavedPin !== null}
        saveLoading={savePinLoading}
        onToggleSave={() => void handleToggleSavePin()}
      />
    </div>
  );
}
