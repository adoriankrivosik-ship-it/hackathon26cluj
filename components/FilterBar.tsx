"use client";

import { useEffect, useId, useState } from "react";
import {
  FILTER_CATEGORIES,
  type CategoryFilter,
  type MapFilters,
} from "@/lib/filters";

interface FilterBarProps {
  filters: MapFilters;
  onCategoryChange: (category: CategoryFilter) => void;
  onDelayedOnlyChange: (delayedOnly: boolean) => void;
  visibleCount: number;
  totalCount: number;
  showCount: boolean;
}

/**
 * Top filter bar: category chips, delayed-only toggle, result count.
 * Desktop: inline chip row. Mobile: "Filtre" button opens a bottom sheet.
 */
export function FilterBar({
  filters,
  onCategoryChange,
  onDelayedOnlyChange,
  visibleCount,
  totalCount,
  showCount,
}: FilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sheetId = useId();

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const delayedToggle = (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-primary/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary">
      <input
        type="checkbox"
        checked={filters.delayedOnly}
        onChange={(e) => onDelayedOnlyChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
      />
      Doar întârziate
    </label>
  );

  const countLabel = showCount && (
    <p className="text-xs text-gray-500" aria-live="polite">
      Afișate:{" "}
      <span className="font-semibold text-gray-800">{visibleCount}</span> din{" "}
      {totalCount} proiecte
    </p>
  );

  const categoryChips = (
    <div
      className="flex flex-wrap gap-1.5"
      role="group"
      aria-label="Filtru categorie"
    >
      <CategoryChip
        label="Toate"
        selected={filters.category === "Toate"}
        onClick={() => onCategoryChange("Toate")}
      />
      {FILTER_CATEGORIES.map((cat) => (
        <CategoryChip
          key={cat}
          label={cat}
          selected={filters.category === cat}
          onClick={() => onCategoryChange(cat)}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="pointer-events-auto hidden w-full min-w-0 flex-col gap-2 md:flex">
        <div className="flex flex-wrap items-center gap-3">
          {categoryChips}
          {delayedToggle}
        </div>
        {countLabel}
      </div>

      {/* Mobile trigger + sheet */}
      <div className="pointer-events-auto md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-sm font-medium text-primary shadow-md ring-1 ring-gray-200/80 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
          Filtre
          {showCount && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {visibleCount}/{totalCount}
            </span>
          )}
        </button>

        <div
          className={`fixed inset-0 z-40 transition-opacity duration-panel ${
            mobileOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!mobileOpen}
        >
          <button
            type="button"
            className="absolute inset-0 bg-primary-dark/40 backdrop-blur-[2px]"
            aria-label="Închide filtrele"
            onClick={() => setMobileOpen(false)}
          />
          <div
            id={sheetId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${sheetId}-title`}
            className={`absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white px-5 pb-8 pt-5 shadow-panel transition-transform duration-panel ease-out ${
              mobileOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                id={`${sheetId}-title`}
                className="text-base font-semibold text-gray-900"
              >
                Filtre
              </h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Închide"
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

            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Categorie
            </p>
            <div className="mb-5 flex flex-wrap gap-1.5">{categoryChips}</div>

            <div className="mb-4">{delayedToggle}</div>
            {countLabel}
          </div>
        </div>
      </div>
    </>
  );
}

function CategoryChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
        selected
          ? "bg-primary text-white shadow-sm"
          : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-primary/30"
      }`}
    >
      {label}
    </button>
  );
}
