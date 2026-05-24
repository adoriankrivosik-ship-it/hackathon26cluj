"use client";

import { useEffect } from "react";
import type { PublicProject } from "@/lib/projects";
import { formatBudgetRon, formatDateRo } from "@/lib/projects";
import { StatusBadge } from "./StatusBadge";
import { StatusTimeline } from "./StatusTimeline";

interface ProjectDetailPanelProps {
  project: PublicProject | null;
  onClose: () => void;
}

export function ProjectDetailPanel({
  project,
  onClose,
}: ProjectDetailPanelProps) {
  const isOpen = project !== null;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile backdrop */}
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
        aria-labelledby="project-panel-title"
        aria-hidden={!isOpen}
        className={`fixed z-30 flex flex-col bg-surface-elevated shadow-panel transition-transform duration-panel ease-out
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
          md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[380px] md:rounded-none md:rounded-l-2xl md:shadow-[-4px_0_24px_rgba(15,76,92,0.12)]
          ${isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}
        `}
      >
        {project && (
          <>
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 pb-4 pt-5 md:pt-6">
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">
                  {project.category}
                </p>
                <h2
                  id="project-panel-title"
                  className="text-lg font-semibold leading-snug text-gray-900 md:text-xl"
                >
                  {project.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={project.status} />
                  {project.isDelayed && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                      Întârziat
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Închide panoul de detalii"
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
              <section aria-label="Progres">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Progres</span>
                  <span className="tabular-nums text-gray-600">
                    {project.progressPercent}%
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-gray-100"
                  role="progressbar"
                  aria-valuenow={project.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
              </section>

              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Buget
                  </dt>
                  <dd className="mt-0.5 text-base font-semibold text-gray-900">
                    {formatBudgetRon(project.budget)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Sursă finanțare
                  </dt>
                  <dd className="mt-0.5 text-gray-800">
                    {project.fundingSource}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Început
                    </dt>
                    <dd className="mt-0.5 text-gray-800">
                      {formatDateRo(project.startDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Termen planificat
                    </dt>
                    <dd
                      className={`mt-0.5 ${project.isDelayed ? "font-medium text-red-700" : "text-gray-800"}`}
                    >
                      {formatDateRo(project.plannedEndDate)}
                    </dd>
                  </div>
                </div>
              </dl>

              <p className="mt-6 text-sm leading-relaxed text-gray-600">
                {project.description}
              </p>

              {project.moreInfoUrl && (
                <p className="mt-4">
                  <a
                    href={project.moreInfoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-dark hover:underline"
                  >
                    Citiți mai mult despre acest proiect
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <span className="sr-only">(se deschide într-o fereastră nouă)</span>
                  </a>
                </p>
              )}

              <section className="mt-8" aria-label="Cronologie status">
                <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Etape proiect
                </h3>
                <StatusTimeline currentStatus={project.status} />
              </section>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
