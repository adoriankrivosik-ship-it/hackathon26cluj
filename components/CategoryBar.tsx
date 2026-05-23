"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { WalkSubcategoryKey } from "@/lib/walkscore-config";

export interface SubcategoryBreakdown {
  key: WalkSubcategoryKey;
  label: string;
  count: number;
  mapVisible: boolean;
  onToggleMapVisible: () => void;
}

interface CategoryBarProps {
  label: string;
  count: number;
  score: number;
  color: string;
  animate: boolean;
  mapVisible: boolean;
  mapIndeterminate?: boolean;
  onToggleMapVisible: () => void;
  subcategories?: SubcategoryBreakdown[];
}

function MapFilterCheckbox({
  id,
  checked,
  indeterminate,
  onChange,
  className = "",
}: {
  id: string;
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate ?? false;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary ${className}`}
    />
  );
}

export function CategoryBar({
  label,
  count,
  score,
  color,
  animate,
  mapVisible,
  mapIndeterminate = false,
  onToggleMapVisible,
  subcategories,
}: CategoryBarProps) {
  const [width, setWidth] = useState(animate ? 0 : score);
  const categoryInputId = useId();

  useEffect(() => {
    if (!animate) {
      setWidth(score);
      return;
    }
    setWidth(0);
    const frame = requestAnimationFrame(() => setWidth(score));
    return () => cancelAnimationFrame(frame);
  }, [animate, score]);

  const dimmed = !mapVisible && !mapIndeterminate;

  return (
    <div className={dimmed ? "opacity-50" : undefined}>
      <div className="mb-1 flex items-center gap-2 text-sm">
        <MapFilterCheckbox
          id={categoryInputId}
          checked={mapVisible}
          indeterminate={mapIndeterminate}
          onChange={onToggleMapVisible}
        />
        <label
          htmlFor={categoryInputId}
          className={`min-w-0 flex-1 cursor-pointer ${
            dimmed ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {label}{" "}
          <span className="text-gray-400">({count})</span>
        </label>
        <span className="shrink-0 tabular-nums font-medium text-gray-900">
          {score}
        </span>
      </div>
      <div
        className="ml-6 h-2 overflow-hidden rounded-full bg-gray-100"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${score} din 100`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-[400ms] ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {subcategories && subcategories.length > 0 && (
        <ul
          className="mt-2 space-y-1 border-l-2 border-gray-100 pl-3"
          aria-label={`${label} — detaliu`}
        >
          {subcategories.map((sub) => {
            const subId = `${categoryInputId}-${sub.key}`;
            return (
              <li key={sub.key}>
                <div className="flex items-center gap-2 text-xs">
                  <MapFilterCheckbox
                    id={subId}
                    checked={sub.mapVisible}
                    onChange={sub.onToggleMapVisible}
                  />
                  <label
                    htmlFor={subId}
                    className={`min-w-0 flex-1 cursor-pointer ${
                      sub.mapVisible ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {sub.label}
                  </label>
                  <span className="shrink-0 tabular-nums text-gray-400">
                    {sub.count}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
