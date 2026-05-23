"use client";

import type { ReactNode } from "react";

export type MapMode = "projects" | "walkscore";

interface MapModeToggleProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
}

export function MapModeToggle({ mode, onChange }: MapModeToggleProps) {
  return (
    <div
      className="pointer-events-auto inline-flex rounded-xl bg-white/95 p-1 shadow-md ring-1 ring-gray-200/80 backdrop-blur-sm"
      role="tablist"
      aria-label="Mod hartă"
    >
      <ModeButton
        selected={mode === "projects"}
        onClick={() => onChange("projects")}
      >
        Proiecte
      </ModeButton>
      <ModeButton
        selected={mode === "walkscore"}
        onClick={() => onChange("walkscore")}
      >
        Scor 15 minute
      </ModeButton>
    </div>
  );
}

function ModeButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-panel ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 md:px-4 md:text-sm ${
        selected
          ? "bg-primary text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}
