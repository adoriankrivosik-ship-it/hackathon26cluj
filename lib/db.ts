import "server-only";

import type {
  ProjectCategory,
  ProjectStatus,
  PublicProject,
} from "./projects";

/** Row shape from D1 `projects` table (snake_case). */
interface ProjectRow {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  budget: number;
  funding_source: string;
  lng: number;
  lat: number;
  start_date: string;
  planned_end_date: string;
  progress_percent: number;
  is_delayed: number;
}

function mapRow(row: ProjectRow): PublicProject {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as ProjectCategory,
    status: row.status as ProjectStatus,
    budget: row.budget,
    fundingSource: row.funding_source,
    coordinates: [row.lng, row.lat],
    startDate: row.start_date,
    plannedEndDate: row.planned_end_date,
    isDelayed: row.is_delayed === 1,
    progressPercent: row.progress_percent,
  };
}

/** Load all projects from a D1 binding. */
export async function getProjects(db: D1Database): Promise<PublicProject[]> {
  const { results } = await db
    .prepare("SELECT * FROM projects ORDER BY id")
    .all<ProjectRow>();

  return (results ?? []).map(mapRow);
}

/** Resolve the local/production D1 binding and fetch projects. */
export async function loadProjects(): Promise<PublicProject[]> {
  const db = await getDatabase();
  return getProjects(db);
}

/** True when running on Cloudflare Pages with a real D1 binding. */
function isCloudflarePagesRuntime(): boolean {
  return process.env.CF_PAGES === "1";
}

async function getDatabase(): Promise<D1Database> {
  if (!isCloudflarePagesRuntime()) {
    const { createSqliteD1Adapter } = await import("./dev-db-adapter");
    return createSqliteD1Adapter();
  }

  const { getCloudflareDatabase } = await import("./get-database.cloudflare");
  return getCloudflareDatabase();
}
