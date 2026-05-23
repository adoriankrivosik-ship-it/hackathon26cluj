"use client";

import { useId, useState } from "react";
import { SCORE_LEGEND_STOPS } from "@/lib/score-colors";

/**
 * Score color scale legend for neighborhood mode.
 */
export function ScoreLegend() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const legendId = useId();

  const content = (
    <div className="space-y-2">
      <p className="text-[10px] leading-snug text-gray-500">
        Scor accesibilitate 15 min (mers pe jos)
      </p>
      <ul className="space-y-1.5" role="list">
        {SCORE_LEGEND_STOPS.map(({ label, color }) => (
          <li key={label} className="flex items-center gap-2 text-xs text-gray-700">
            <span
              className="h-3 w-6 shrink-0 rounded-sm ring-1 ring-black/10"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <div
        className="pointer-events-auto hidden md:block"
        role="region"
        aria-label="Legendă scor cartiere"
      >
        <div className="rounded-xl bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm ring-1 ring-gray-200/80">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Scor 15 min
          </p>
          {content}
        </div>
      </div>

      <div className="pointer-events-auto md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls={legendId}
          className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow-md ring-1 ring-gray-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 transition-transform duration-panel ${mobileOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          Legendă scor
        </button>
        <div
          id={legendId}
          className={`mt-2 overflow-hidden transition-all duration-panel ease-out ${
            mobileOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
          }`}
          aria-hidden={!mobileOpen}
        >
          <div className="rounded-xl bg-white/95 px-3 py-2.5 shadow-md ring-1 ring-gray-200/80">
            {content}
          </div>
        </div>
      </div>
    </>
  );
}
