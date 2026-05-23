import type { ProjectCategory, ProjectStatus, PublicProject } from "./projects";
import { PROJECT_STATUSES } from "./projects";

/** All selectable categories in the filter UI (excluding "Toate"). */
export const FILTER_CATEGORIES: ProjectCategory[] = [
  "Infrastructură rutieră",
  "Parcuri și spații verzi",
  "Transport public",
  "Educație",
  "Utilități",
];

export type CategoryFilter = ProjectCategory | "Toate";

export interface MapFilters {
  category: CategoryFilter;
  delayedOnly: boolean;
  activeStatuses: Set<ProjectStatus>;
}

export function createDefaultFilters(): MapFilters {
  return {
    category: "Toate",
    delayedOnly: false,
    activeStatuses: new Set(PROJECT_STATUSES),
  };
}

/** Returns true when any filter narrows the result set from the default. */
export function hasActiveFilters(filters: MapFilters): boolean {
  if (filters.category !== "Toate") return true;
  if (filters.delayedOnly) return true;
  if (filters.activeStatuses.size < PROJECT_STATUSES.length) return true;
  return false;
}

/** Category + status + delayed toggle — all must pass. */
export function projectMatchesFilters(
  project: PublicProject,
  filters: MapFilters,
): boolean {
  if (filters.category !== "Toate" && project.category !== filters.category) {
    return false;
  }
  if (filters.delayedOnly && !project.isDelayed) {
    return false;
  }
  if (!filters.activeStatuses.has(project.status)) {
    return false;
  }
  return true;
}

export function filterProjects(
  all: PublicProject[],
  filters: MapFilters,
): PublicProject[] {
  return all.filter((p) => projectMatchesFilters(p, filters));
}
