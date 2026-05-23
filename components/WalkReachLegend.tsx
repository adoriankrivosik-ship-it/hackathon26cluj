"use client";

import { WALK_REACH_MINUTES } from "@/lib/walking-isochrone";

interface WalkReachLegendProps {
  loadingLocation: boolean;
  loadingIsochrone: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function WalkReachLegend({
  loadingLocation,
  loadingIsochrone,
  error,
  onRetry,
}: WalkReachLegendProps) {
  return (
    <div
      className="pointer-events-auto rounded-xl bg-white/95 px-3 py-2.5 shadow-md ring-1 ring-gray-200/80 backdrop-blur-sm"
      role="region"
      aria-label="Legendă zonă 15 minute"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        Oraș de {WALK_REACH_MINUTES} minute
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <span
          className="h-3 w-6 shrink-0 rounded-sm border border-primary/30 bg-primary/25"
          aria-hidden="true"
        />
        <span className="text-xs text-gray-700">
          Distanță parcursă pe jos în ~{WALK_REACH_MINUTES} min
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white bg-sky-500 shadow-sm"
          aria-hidden="true"
        />
        <span>Locația ta</span>
      </div>
      {(loadingLocation || loadingIsochrone) && (
        <p className="mt-2 text-xs text-gray-500" aria-live="polite">
          {loadingLocation
            ? "Se detectează locația…"
            : "Se calculează zona de mers…"}
        </p>
      )}
      {error && (
        <div className="mt-2">
          <p className="text-xs text-amber-800">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Încearcă din nou
            </button>
          )}
        </div>
      )}
    </div>
  );
}
