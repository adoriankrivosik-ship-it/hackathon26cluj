import type { DbProject } from "./admin-types";
import type { ProjectCategory, ProjectStatus, PublicProject } from "./projects";

/** Map admin schema row → public map project (best-effort). */
export function mapToPublicProject(row: DbProject): PublicProject {
  const statusMap: Record<string, ProjectStatus> = {
    planned: "Inițiat",
    procurement: "Bugetat",
    starting: "În lucru",
    continuing: "În lucru",
    finalizing: "În lucru",
    delayed: "În lucru",
    completed: "Finalizat",
  };
  const categoryMap: Record<string, ProjectCategory> = {
    mobility: "Infrastructură rutieră",
    education: "Educație",
    green: "Parcuri și spații verzi",
    social: "Utilități",
    cultural: "Infrastructură rutieră",
    energy: "Utilități",
    housing: "Utilități",
    waste: "Utilități",
  };

  const lng = row.location_lng ?? 23.59;
  const lat = row.location_lat ?? 46.77;

  return {
    id: row.id,
    title: row.name,
    description: row.description_plain ?? row.description_original ?? "",
    category: categoryMap[row.category ?? ""] ?? "Utilități",
    status: statusMap[row.status] ?? "În lucru",
    budget: row.budget_ron ?? 0,
    fundingSource: row.budget_source ?? "",
    coordinates: [lng, lat],
    startDate: row.start_date ?? "",
    plannedEndDate: row.end_date ?? "",
    isDelayed: row.status === "delayed",
    progressPercent:
      row.status === "completed"
        ? 100
        : row.status === "finalizing"
          ? 85
          : row.status === "continuing"
            ? 50
            : 15,
    moreInfoUrl: row.source_url?.trim() || null,
  };
}
