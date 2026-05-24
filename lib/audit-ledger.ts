import "server-only";

import {
  computeDataHash,
  type AppendAuditParams,
  type AuditLedgerRow,
  verifyAuditRows,
} from "./audit-ledger-core";
import { getDatabase } from "./db";

export type { AuditAction, AuditLedgerRow, AppendAuditParams } from "./audit-ledger-core";
export {
  AUDIT_LEDGER_SEED,
  computeDataHash,
  sha256Hex,
} from "./audit-ledger-core";

async function getLastDataHash(db: D1Database): Promise<string> {
  const row = await db
    .prepare(
      `SELECT data_hash FROM audit_ledger ORDER BY id DESC LIMIT 1`,
    )
    .first<{ data_hash: string }>();
  return row?.data_hash ?? "GENESIS";
}

export async function appendAuditEntry(
  db: D1Database,
  params: AppendAuditParams,
): Promise<void> {
  const timestamp = new Date().toISOString();
  const prevHash = await getLastDataHash(db);
  const newValue = params.newValue ?? "";
  const dataHash = await computeDataHash({
    prevHash,
    timestamp,
    userId: params.userId,
    action: params.action,
    entityId: params.entityId,
    newValue,
  });

  await db
    .prepare(
      `INSERT INTO audit_ledger (
        timestamp, user_id, user_label, action, entity_type, entity_id,
        field_changed, old_value, new_value, prev_hash, data_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      timestamp,
      params.userId,
      params.userLabel,
      params.action,
      params.entityType,
      params.entityId,
      params.fieldChanged ?? null,
      params.oldValue ?? null,
      params.newValue ?? null,
      prevHash,
      dataHash,
    )
    .run();
}

export async function listAuditLedger(limit = 500): Promise<AuditLedgerRow[]> {
  const db = await getDatabase();
  const { results } = await db
    .prepare(
      `SELECT * FROM audit_ledger ORDER BY timestamp DESC, id DESC LIMIT ?`,
    )
    .bind(limit)
    .all<AuditLedgerRow>();
  return results ?? [];
}

export async function verifyAuditChain(
  db: D1Database,
): Promise<{ valid: boolean; brokenAtId: number | null }> {
  const { results } = await db
    .prepare(`SELECT * FROM audit_ledger ORDER BY id ASC`)
    .all<AuditLedgerRow>();
  return verifyAuditRows(results ?? []);
}
