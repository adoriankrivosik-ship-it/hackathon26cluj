"use client";

import { useId, useState } from "react";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/projects";
import { STATUS_COLORS } from "@/lib/status-colors";

interface StatusLegendProps {
  activeStatuses: Set<ProjectStatus>;
  onToggleStatus: (status: ProjectStatus) => void;
}

/**
 * Compact status legend with clickable toggles (quick status filter).
 * Always visible on desktop; collapsible panel on mobile.
 */
export function StatusLegend({
  activeStatuses,
  onToggleStatus,
}: StatusLegendProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const legendId = useId();

  const legendContent = (
    <ul className="space-y-1.5" role="list">
      {PROJECT_STATUSES.map((status) => {
        const isActive = activeStatuses.has(status);
        const colors = STATUS_COLORS[status];

        return (
          <li key={status}>
            <button
              type="button"
              onClick={() => onToggleStatus(status)}
              aria-pressed={isActive}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? "text-gray-800 hover:bg-gray-50"
                  : "text-gray-400 line-through opacity-60 hover:bg-gray-50 hover:opacity-80"
              }`}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: colors.fill }}
                aria-hidden="true"
              />
              <span>{status}</span>
            </button>
          </li>
        );
      })}
      <li className="border-t border-gray-100 pt-1.5">
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-600">
          <span className="relative flex h-3 w-3 shrink-0 items-center justify-center" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
            <span className="absolute inset-0 rounded-full ring-[2px] ring-red-500" />
          </span>
          <span>Întârziat</span>
        </div>
      </li>
    </ul>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div
        className="pointer-events-auto hidden md:block"
        role="region"
        aria-label="Legendă status proiecte"
      >
        <div className="rounded-xl bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm ring-1 ring-gray-200/80">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Status
          </p>
          {legendContent}
        </div>
      </div>

      {/* Mobile: collapsible */}
      <div className="pointer-events-auto md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls={legendId}
          className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow-md backdrop-blur-sm ring-1 ring-gray-200/80 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 transition-transform duration-200 ${mobileOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          Legendă
        </button>

        <div
          id={legendId}
          className={`mt-2 overflow-hidden transition-all duration-panel ease-out ${
            mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          }`}
          aria-hidden={!mobileOpen}
        >
          <div className="rounded-xl bg-white/95 px-3 py-2.5 shadow-md ring-1 ring-gray-200/80">
            {legendContent}
          </div>
        </div>
      </div>
    </>
  );
}
