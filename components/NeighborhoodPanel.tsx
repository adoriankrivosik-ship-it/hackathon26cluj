"use client";

import { useEffect, useMemo } from "react";
import {
  getProjectsInNeighborhood,
  SCORE_LABELS,
  type Neighborhood,
} from "@/lib/neighborhoods";
import { scoreToColor } from "@/lib/score-colors";
import { ScoreBar } from "./ScoreBar";
import { StatusBadge } from "./StatusBadge";

interface NeighborhoodPanelProps {
  neighborhood: Neighborhood | null;
  onClose: () => void;
}

/**
 * Detail panel for a selected neighborhood: 15-min scores + linked public projects.
 */
export function NeighborhoodPanel({
  neighborhood,
  onClose,
}: NeighborhoodPanelProps) {
  const isOpen = neighborhood !== null;

  const linkedProjects = useMemo(
    () => (neighborhood ? getProjectsInNeighborhood(neighborhood) : []),
    [neighborhood],
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const scoreColor = neighborhood
    ? scoreToColor(neighborhood.overallScore)
    : undefined;

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
        aria-labelledby="neighborhood-panel-title"
        aria-hidden={!isOpen}
        className={`fixed z-30 flex flex-col bg-surface-elevated shadow-panel transition-transform duration-panel ease-out
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
          md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[380px] md:rounded-none md:rounded-l-2xl md:shadow-[-4px_0_24px_rgba(15,76,92,0.12)]
          ${isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}
        `}
      >
        {neighborhood && (
          <>
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 pb-4 pt-5 md:pt-6">
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
                  Oraș de 15 minute
                </p>
                <h2
                  id="neighborhood-panel-title"
                  className="text-lg font-semibold leading-snug text-gray-900 md:text-xl"
                >
                  {neighborhood.name}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {neighborhood.amenityCount} facilități evaluate în cartier
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Închide panoul cartierului"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              <div className="mb-6 flex items-end gap-3">
                <p
                  className="text-5xl font-bold tabular-nums leading-none"
                  style={{ color: scoreColor }}
                  aria-label={`Scor general: ${neighborhood.overallScore} din 100`}
                >
                  {neighborhood.overallScore}
                </p>
                <div className="pb-1">
                  <p className="text-sm font-medium text-gray-700">
                    Scor general
                  </p>
                  <p className="text-xs text-gray-500">din 100</p>
                </div>
              </div>

              <section aria-label="Scoruri pe categorii" className="space-y-4">
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Acces în 15 minute
                </h3>
                {SCORE_LABELS.map(({ key, label }) => (
                  <ScoreBar
                    key={key}
                    label={label}
                    value={neighborhood.scores[key]}
                    animate={isOpen}
                  />
                ))}
              </section>

              <section
                className="mt-8 rounded-xl border border-gray-100 bg-gray-50/80 p-4"
                aria-label="Proiecte publice în cartier"
              >
                <h3 className="text-sm font-semibold text-gray-900">
                  Proiecte publice active în acest cartier:{" "}
                  <span className="text-primary">{linkedProjects.length}</span>
                </h3>
                {linkedProjects.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">
                    Niciun proiect înregistrat în limitele acestui cartier.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2" role="list">
                    {linkedProjects.map((project) => (
                      <li
                        key={project.id}
                        className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-gray-100"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {project.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <StatusBadge status={project.status} />
                          {project.isDelayed && (
                            <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200">
                              Întârziat
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
