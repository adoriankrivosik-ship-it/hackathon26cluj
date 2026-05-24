"use client";

import { useEffect } from "react";
import {
  WALK_CATEGORIES,
  type WalkCategoryKey,
  type WalkSubcategoryKey,
} from "@/lib/walkscore-config";
import type { WalkMapVisibility } from "@/lib/walk-category-filter";
import {
  isCategoryFullyOnMap,
  isCategoryPartiallyOnMap,
  isWalkMapFilterActive,
} from "@/lib/walk-category-filter";
import { scoreToColor } from "@/lib/walkscore-colors";
import type { WalkScoreResult } from "@/lib/walkscore-types";
import { CategoryBar } from "./CategoryBar";

interface WalkScorePanelProps {
  result: WalkScoreResult | null;
  loading: boolean;
  error: string | null;
  mapVisibility: WalkMapVisibility;
  onToggleCategoryOnMap: (category: WalkCategoryKey) => void;
  onToggleSubcategoryOnMap: (subcategory: WalkSubcategoryKey) => void;
  onShowAllOnMap: () => void;
  onHideAllOnMap: () => void;
  relevantOnly: boolean;
  onRelevantOnlyChange: (value: boolean) => void;
  visibleOnMapCount: number;
  onClose: () => void;
  showSaveHeart?: boolean;
  isSaved?: boolean;
  saveLoading?: boolean;
  onToggleSave?: () => void;
}

export function WalkScorePanel({
  result,
  loading,
  error,
  mapVisibility,
  onToggleCategoryOnMap,
  onToggleSubcategoryOnMap,
  onShowAllOnMap,
  onHideAllOnMap,
  relevantOnly,
  onRelevantOnlyChange,
  visibleOnMapCount,
  onClose,
  showSaveHeart = false,
  isSaved = false,
  saveLoading = false,
  onToggleSave,
}: WalkScorePanelProps) {
  const isOpen = loading || error !== null || result !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const overallColor = result ? scoreToColor(result.overallScore) : undefined;
  const totalAmenities = result?.amenities.length ?? 0;
  const mapFilterActive = result
    ? isWalkMapFilterActive(mapVisibility)
    : false;

  return (
    <>
      <div
        className={`fixed inset-0 z-20 bg-primary-dark/40 backdrop-blur-[2px] transition-opacity duration-panel md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="walkscore-panel-title"
        aria-busy={loading}
        aria-hidden={!isOpen}
        className={`fixed z-30 flex flex-col bg-surface-elevated shadow-panel transition-transform duration-panel ease-out
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
          md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[380px] md:rounded-none md:rounded-l-2xl
          ${isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}
        `}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 pb-4 pt-5 md:pt-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Scor 15 minute
            </p>
            <h2
              id="walkscore-panel-title"
              className="text-lg font-semibold leading-snug text-gray-900 md:text-xl"
            >
              Accesibilitate pe jos
            </h2>
            {result?.cached && (
              <p className="mt-1 text-xs text-gray-500">Rezultat din cache</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {showSaveHeart && result && !loading && !error && (
              <button
                type="button"
                onClick={onToggleSave}
                disabled={saveLoading}
                className={`rounded-lg p-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSaved
                    ? "text-red-500 hover:bg-red-50"
                    : "text-gray-400 hover:bg-gray-100 hover:text-red-400"
                } disabled:opacity-50`}
                aria-label={isSaved ? "Elimină pin salvat" : "Salvează pin"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isSaved ? "scale-110 fill-current" : "fill-none"
                  }`}
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Închide panoul"
            >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {loading && (
            <div className="space-y-4" aria-live="polite">
              <p className="text-sm text-gray-600">
                Se calculează zona de 15 minute și facilitățile din OpenStreetMap…
              </p>
              <div className="h-12 w-24 animate-pulse rounded-lg bg-gray-100" />
              <div className="space-y-3">
                {WALK_CATEGORIES.map((c) => (
                  <div key={c.key} className="space-y-1">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                    <div className="h-2 animate-pulse rounded-full bg-gray-100" />
                  </div>
                ))}
              </div>
              <div
                className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
                role="status"
                aria-label="Se încarcă"
              />
            </div>
          )}

          {error && !loading && (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              role="alert"
            >
              {error}
            </div>
          )}

          {result && !loading && !error && (
            <>
              <p className="text-sm leading-relaxed text-gray-600">
                Tot ce poți atinge în 15 minute de mers pe jos de aici
              </p>

              <div className="mt-4 flex items-end gap-3">
                <p
                  className="text-5xl font-bold tabular-nums leading-none"
                  style={{ color: overallColor }}
                >
                  {result.overallScore}
                </p>
                <div className="pb-1">
                  <p className="text-sm font-medium text-gray-700">Scor general</p>
                  <p className="text-xs text-gray-500">din 100</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {mapFilterActive ? visibleOnMapCount : totalAmenities}
                  </span>
                  {mapFilterActive ? (
                    <>
                      {" "}
                      afișate pe hartă din{" "}
                      <span className="font-medium text-gray-800">
                        {totalAmenities}
                      </span>
                    </>
                  ) : (
                    " facilități în zona accesibilă"
                  )}
                </p>
                <div className="flex gap-1 text-xs">
                  <button
                    type="button"
                    onClick={onShowAllOnMap}
                    className="rounded-md px-2 py-0.5 font-medium text-primary hover:bg-primary/5"
                  >
                    Toate
                  </button>
                  <button
                    type="button"
                    onClick={onHideAllOnMap}
                    className="rounded-md px-2 py-0.5 font-medium text-gray-500 hover:bg-gray-100"
                  >
                    Niciuna
                  </button>
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 transition-colors duration-200 hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-800">
                  Arată doar cele mai relevante
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={relevantOnly}
                  onClick={() => onRelevantOnlyChange(!relevantOnly)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    relevantOnly ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      relevantOnly ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>

              <section
                className="mt-5 space-y-4"
                aria-label="Scoruri pe categorii"
              >
                {WALK_CATEGORIES.map((cat) => {
                  const fullyOn = isCategoryFullyOnMap(cat, mapVisibility);
                  const partial = isCategoryPartiallyOnMap(cat, mapVisibility);

                  return (
                    <CategoryBar
                      key={cat.key}
                      label={cat.label}
                      count={result.counts[cat.key]}
                      score={result.scores[cat.key]}
                      color={cat.color}
                      animate={isOpen}
                      mapVisible={fullyOn}
                      mapIndeterminate={partial}
                      onToggleMapVisible={() => onToggleCategoryOnMap(cat.key)}
                      subcategories={cat.subcategories?.map((sub) => ({
                        key: sub.key,
                        label: sub.label,
                        count: result.subcategoryCounts[sub.key] ?? 0,
                        mapVisible: mapVisibility.subcategories.has(sub.key),
                        onToggleMapVisible: () =>
                          onToggleSubcategoryOnMap(sub.key),
                      }))}
                    />
                  );
                })}
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
