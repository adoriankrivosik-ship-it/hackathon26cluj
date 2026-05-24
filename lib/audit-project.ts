import "server-only";

import type { DbProject, ProjectInput } from "./admin-types";
import {
  appendAuditEntry,
  type AuditAction,
  type AppendAuditParams,
} from "./audit-ledger";

const TRACKED_FIELDS: (keyof ProjectInput)[] = [
  "name",
  "description_original",
  "status",
  "category",
  "budget_ron",
  "budget_source",
  "responsible_institution",
  "location_lat",
  "location_lng",
  "address",
  "district",
  "start_date",
  "end_date",
  "source_url",
  "source_type",
];

function toAuditString(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

export async function auditProjectFieldChanges(
  db: D1Database,
  session: { id: string; name: string },
  projectId: string,
  existing: DbProject,
  updates: Partial<ProjectInput>,
): Promise<void> {
  for (const field of TRACKED_FIELDS) {
    if (!(field in updates)) continue;

    const oldRaw = existing[field as keyof DbProject];
    const newRaw = updates[field];
    const oldValue = toAuditString(oldRaw);
    const newValue = toAuditString(newRaw);
    if (oldValue === newValue) continue;

    const action: AuditAction =
      field === "status" ? "UPDATE_STATUS" : "UPDATE_DETAILS";

    const entry: AppendAuditParams = {
      userId: session.id,
      userLabel: session.name,
      action,
      entityType: "project",
      entityId: projectId,
      fieldChanged: field,
      oldValue: oldValue || null,
      newValue: newValue || null,
    };

    await appendAuditEntry(db, entry);
  }
}
