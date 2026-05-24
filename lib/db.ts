import "server-only";

import type {
  DbIssueReport,
  DbLedgerEntry,
  DbProject,
  IssueStatusDb,
  ProjectInput,
  ProjectStatusDb,
} from "./admin-types";
import type { PublicProject, ProjectCategory, ProjectStatus } from "./projects";

export function generateProjectId(): string {
  return `proj_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function generateNotificationId(): string {
  return `notif_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function isCloudflarePagesRuntime(): boolean {
  return process.env.CF_PAGES === "1";
}

export async function getDatabase(): Promise<D1Database> {
  if (!isCloudflarePagesRuntime()) {
    const { createSqliteD1Adapter } = await import("./dev-db-adapter");
    return createSqliteD1Adapter();
  }
  const { getCloudflareDatabase } = await import("./get-database.cloudflare");
  return getCloudflareDatabase();
}

/** Legacy public map row → PublicProject (best-effort from new schema). */
function mapToPublicProject(row: DbProject): PublicProject {
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
  };
}

export async function getPublicProjects(): Promise<PublicProject[]> {
  const rows = await listProjects();
  return rows.map(mapToPublicProject);
}

export async function loadProjects(): Promise<PublicProject[]> {
  return getPublicProjects();
}

export async function listProjects(filters?: {
  search?: string;
  category?: string;
  status?: string;
}): Promise<DbProject[]> {
  const db = await getDatabase();
  let query = "SELECT * FROM projects WHERE 1=1";
  const binds: unknown[] = [];

  if (filters?.search) {
    query += " AND (name LIKE ? OR description_original LIKE ? OR district LIKE ?)";
    const q = `%${filters.search}%`;
    binds.push(q, q, q);
  }
  if (filters?.category) {
    query += " AND category = ?";
    binds.push(filters.category);
  }
  if (filters?.status) {
    query += " AND status = ?";
    binds.push(filters.status);
  }

  query += " ORDER BY updated_at DESC, name ASC";

  const stmt = db.prepare(query);
  const { results } =
    binds.length > 0
      ? await stmt.bind(...binds).all<DbProject>()
      : await stmt.all<DbProject>();

  return results ?? [];
}

export async function getProjectById(id: string): Promise<DbProject | null> {
  const db = await getDatabase();
  return db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .bind(id)
    .first<DbProject>();
}

export async function createProject(input: ProjectInput): Promise<string> {
  const db = await getDatabase();
  const id = generateProjectId();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO projects (
        id, name, description_original, description_plain, status, category,
        budget_ron, budget_source, responsible_institution, location_lat, location_lng,
        address, district, start_date, end_date, source_url, source_type,
        created_at, updated_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.name,
      input.description_original ?? null,
      input.description_plain ?? null,
      input.status,
      input.category ?? null,
      input.budget_ron ?? null,
      input.budget_source ?? null,
      input.responsible_institution ?? null,
      input.location_lat ?? null,
      input.location_lng ?? null,
      input.address ?? null,
      input.district ?? null,
      input.start_date ?? null,
      input.end_date ?? null,
      input.source_url ?? null,
      input.source_type ?? "manual",
      now,
      now,
      input.created_by ?? null,
    )
    .run();

  return id;
}

export async function updateProject(
  id: string,
  input: Partial<ProjectInput>,
): Promise<void> {
  const db = await getDatabase();
  const existing = await getProjectById(id);
  if (!existing) throw new Error("NOT_FOUND");

  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE projects SET
        name = ?, description_original = ?, description_plain = ?, status = ?,
        category = ?, budget_ron = ?, budget_source = ?, responsible_institution = ?,
        location_lat = ?, location_lng = ?, address = ?, district = ?,
        start_date = ?, end_date = ?, source_url = ?, source_type = ?,
        updated_at = ?
      WHERE id = ?`,
    )
    .bind(
      input.name ?? existing.name,
      input.description_original ?? existing.description_original,
      input.description_plain ?? existing.description_plain,
      input.status ?? existing.status,
      input.category ?? existing.category,
      input.budget_ron ?? existing.budget_ron,
      input.budget_source ?? existing.budget_source,
      input.responsible_institution ?? existing.responsible_institution,
      input.location_lat ?? existing.location_lat,
      input.location_lng ?? existing.location_lng,
      input.address ?? existing.address,
      input.district ?? existing.district,
      input.start_date ?? existing.start_date,
      input.end_date ?? existing.end_date,
      input.source_url ?? existing.source_url,
      input.source_type ?? existing.source_type,
      now,
      id,
    )
    .run();
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatusDb,
): Promise<DbProject> {
  const db = await getDatabase();
  const existing = await getProjectById(id);
  if (!existing) throw new Error("NOT_FOUND");
  const now = new Date().toISOString();
  await db
    .prepare("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?")
    .bind(status, now, id)
    .run();
  return { ...existing, status, updated_at: now };
}

export async function setProjectPlainSummary(
  id: string,
  plain: string,
): Promise<void> {
  const db = await getDatabase();
  await db
    .prepare(
      "UPDATE projects SET description_plain = ?, updated_at = ? WHERE id = ?",
    )
    .bind(plain, new Date().toISOString(), id)
    .run();
}

export async function listIssueReports(
  statusFilter?: IssueStatusDb | "all",
): Promise<DbIssueReport[]> {
  const db = await getDatabase();
  let query = "SELECT * FROM issue_reports WHERE 1=1";
  const binds: unknown[] = [];

  if (statusFilter && statusFilter !== "all") {
    query += " AND status = ?";
    binds.push(statusFilter);
  }

  query += " ORDER BY submitted_at DESC, title ASC";

  const stmt = db.prepare(query);
  const { results } =
    binds.length > 0
      ? await stmt.bind(...binds).all<DbIssueReport>()
      : await stmt.all<DbIssueReport>();

  return results ?? [];
}

export async function getIssueReportById(
  id: string,
): Promise<DbIssueReport | null> {
  const db = await getDatabase();
  return db
    .prepare("SELECT * FROM issue_reports WHERE id = ?")
    .bind(id)
    .first<DbIssueReport>();
}

export async function updateIssueReportStatus(
  id: string,
  status: IssueStatusDb,
  resolutionNote?: string | null,
): Promise<DbIssueReport> {
  const db = await getDatabase();
  const existing = await getIssueReportById(id);
  if (!existing) throw new Error("NOT_FOUND");

  const resolvedAt = status === "resolved" ? new Date().toISOString() : null;

  await db
    .prepare(
      `UPDATE issue_reports SET status = ?, resolution_note = ?, resolved_at = ? WHERE id = ?`,
    )
    .bind(status, resolutionNote ?? existing.resolution_note, resolvedAt, id)
    .run();

  return {
    ...existing,
    status,
    resolution_note: resolutionNote ?? existing.resolution_note,
    resolved_at: resolvedAt,
  };
}

export async function listLedgerEntries(limit = 100): Promise<DbLedgerEntry[]> {
  const db = await getDatabase();
  const { results } = await db
    .prepare(
      `SELECT * FROM ledger_entries ORDER BY timestamp DESC LIMIT ?`,
    )
    .bind(limit)
    .all<DbLedgerEntry>();
  return results ?? [];
}

export async function getProjectSubscribers(
  projectId: string,
): Promise<string[]> {
  const db = await getDatabase();
  const { results } = await db
    .prepare("SELECT user_id FROM project_subscriptions WHERE project_id = ?")
    .bind(projectId)
    .all<{ user_id: string }>();
  return (results ?? []).map((r) => r.user_id);
}

export async function notifyProjectSubscribers(
  projectId: string,
  message: string,
): Promise<void> {
  const db = await getDatabase();
  const userIds = await getProjectSubscribers(projectId);
  const now = new Date().toISOString();

  for (const userId of userIds) {
    await db
      .prepare(
        `INSERT INTO notifications (id, user_id, project_id, message, read, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`,
      )
      .bind(generateNotificationId(), userId, projectId, message, now)
      .run();
  }
}
