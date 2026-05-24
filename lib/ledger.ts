import type { LedgerActionType } from "./admin-types";
import { getDatabase } from "./db";

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateLedgerId(): string {
  return `led_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export async function getLastLedgerHash(
  projectId: string | null,
): Promise<string> {
  const db = await getDatabase();
  const row = projectId
    ? await db
        .prepare(
          `SELECT entry_hash FROM ledger_entries
           WHERE project_id = ?
           ORDER BY timestamp DESC LIMIT 1`,
        )
        .bind(projectId)
        .first<{ entry_hash: string }>()
    : await db
        .prepare(
          `SELECT entry_hash FROM ledger_entries
           ORDER BY timestamp DESC LIMIT 1`,
        )
        .first<{ entry_hash: string }>();

  return row?.entry_hash ?? "";
}

export async function computeEntryHash(params: {
  previousHash: string;
  timestamp: string;
  projectId: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
}): Promise<string> {
  const payload = [
    params.previousHash,
    params.timestamp,
    params.projectId,
    params.oldValue,
    params.newValue,
    params.changedBy,
  ].join("|");
  return sha256Hex(payload);
}

export interface WriteLedgerParams {
  projectId: string | null;
  actionType: LedgerActionType;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy: string;
  changedByRole: "citizen" | "civil_servant" | "admin";
  note?: string | null;
}

export async function writeLedgerEntry(
  params: WriteLedgerParams,
): Promise<string> {
  const db = await getDatabase();
  const id = generateLedgerId();
  const timestamp = new Date().toISOString();
  const previousHash = await getLastLedgerHash(params.projectId);
  const projectId = params.projectId ?? "";
  const oldValue = params.oldValue ?? "";
  const newValue = params.newValue ?? "";
  const entryHash = await computeEntryHash({
    previousHash,
    timestamp,
    projectId,
    oldValue,
    newValue,
    changedBy: params.changedBy,
  });

  const role =
    params.changedByRole === "admin" ? "civil_servant" : params.changedByRole;

  await db
    .prepare(
      `INSERT INTO ledger_entries (
        id, timestamp, project_id, action_type, old_value, new_value,
        changed_by, changed_by_role, note, previous_hash, entry_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      timestamp,
      params.projectId,
      params.actionType,
      params.oldValue ?? null,
      params.newValue ?? null,
      params.changedBy,
      role,
      params.note ?? null,
      previousHash || null,
      entryHash,
    )
    .run();

  return id;
}
