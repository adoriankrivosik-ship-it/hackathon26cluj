export type AuditAction = "CREATE" | "UPDATE_STATUS" | "UPDATE_DETAILS";

export interface AuditLedgerRow {
  id: number;
  timestamp: string;
  user_id: string;
  user_label: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  prev_hash: string;
  data_hash: string;
}

export interface AppendAuditParams {
  userId: string;
  userLabel: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function computeDataHash(params: {
  prevHash: string;
  timestamp: string;
  userId: string;
  action: AuditAction;
  entityId: string;
  newValue: string;
}): Promise<string> {
  const payload =
    params.prevHash +
    params.timestamp +
    params.userId +
    params.action +
    params.entityId +
    params.newValue;
  return sha256Hex(payload);
}

export async function verifyAuditRows(
  rows: AuditLedgerRow[],
): Promise<{ valid: boolean; brokenAtId: number | null }> {
  let expectedPrev = "GENESIS";
  for (const row of rows) {
    if (row.prev_hash !== expectedPrev) {
      return { valid: false, brokenAtId: row.id };
    }
    const expectedHash = await computeDataHash({
      prevHash: row.prev_hash,
      timestamp: row.timestamp,
      userId: row.user_id,
      action: row.action,
      entityId: row.entity_id,
      newValue: row.new_value ?? "",
    });
    if (expectedHash !== row.data_hash) {
      return { valid: false, brokenAtId: row.id };
    }
    expectedPrev = row.data_hash;
  }
  return { valid: true, brokenAtId: null };
}

/** Seed rows — mirrors migrations/0004_ledger.sql */
export const AUDIT_LEDGER_SEED: AuditLedgerRow[] = [
  {
    id: 1,
    timestamp: "2025-11-10T09:15:00.000Z",
    user_id: "usr_admin_01",
    user_label: "Admin Cluj",
    action: "CREATE",
    entity_type: "project",
    entity_id: "pasarela-manastur-2026",
    field_changed: null,
    old_value: null,
    new_value: "Pasarela pietonală Mănăștur",
    prev_hash: "GENESIS",
    data_hash:
      "1fa9e84a9fa48487374be33738953a095b71f014f297a7d100bf68f06e7b680a",
  },
  {
    id: 2,
    timestamp: "2025-12-01T14:30:00.000Z",
    user_id: "usr_admin_01",
    user_label: "Admin Cluj",
    action: "UPDATE_STATUS",
    entity_type: "project",
    entity_id: "pasarela-manastur-2026",
    field_changed: "status",
    old_value: "planned",
    new_value: "procurement",
    prev_hash:
      "1fa9e84a9fa48487374be33738953a095b71f014f297a7d100bf68f06e7b680a",
    data_hash:
      "c892ced07aef956efb7195b823475e297722047add6c5cf1fe1556d7547aa04f",
  },
  {
    id: 3,
    timestamp: "2026-01-15T11:00:00.000Z",
    user_id: "usr_func_02",
    user_label: "Func. Ionescu",
    action: "UPDATE_STATUS",
    entity_type: "project",
    entity_id: "pasarela-manastur-2026",
    field_changed: "status",
    old_value: "procurement",
    new_value: "continuing",
    prev_hash:
      "c892ced07aef956efb7195b823475e297722047add6c5cf1fe1556d7547aa04f",
    data_hash:
      "f0c50bb68a2edc035fc1113aada8fdfa02953f25ea20427bf9172e0075b30fa3",
  },
  {
    id: 4,
    timestamp: "2026-02-20T16:45:00.000Z",
    user_id: "usr_admin_01",
    user_label: "Admin Cluj",
    action: "UPDATE_STATUS",
    entity_type: "project",
    entity_id: "piata-mihai-viteazu-2026",
    field_changed: "status",
    old_value: "continuing",
    new_value: "finalizing",
    prev_hash:
      "f0c50bb68a2edc035fc1113aada8fdfa02953f25ea20427bf9172e0075b30fa3",
    data_hash:
      "a49dc63cc48ef0aed70e842988290fb38bf0cba5a23467c4b39f6337e190deb3",
  },
  {
    id: 5,
    timestamp: "2026-03-05T10:20:00.000Z",
    user_id: "usr_func_03",
    user_label: "Func. Popescu",
    action: "UPDATE_DETAILS",
    entity_type: "project",
    entity_id: "scoala-11-rehab-2026",
    field_changed: "budget_ron",
    old_value: "4200000",
    new_value: "4500000",
    prev_hash:
      "a49dc63cc48ef0aed70e842988290fb38bf0cba5a23467c4b39f6337e190deb3",
    data_hash:
      "1c721a042a3c742636ab2f925f564f420b1f76703c451b5e8f5086b907522896",
  },
  {
    id: 6,
    timestamp: "2026-03-18T08:00:00.000Z",
    user_id: "usr_admin_01",
    user_label: "Admin Cluj",
    action: "UPDATE_STATUS",
    entity_type: "project",
    entity_id: "piste-floresti-2026",
    field_changed: "status",
    old_value: "planned",
    new_value: "procurement",
    prev_hash:
      "1c721a042a3c742636ab2f925f564f420b1f76703c451b5e8f5086b907522896",
    data_hash:
      "5ff5ca3fa38749a30b8f12782837406dfed3148a4ce1bf348f418608649cddf6",
  },
];

export const AUDIT_PROJECT_LABELS: Record<string, string> = {
  "pasarela-manastur-2026": "Pasarela pietonală Mănăștur",
  "piata-mihai-viteazu-2026": "Modernizare Piața Mihai Viteazu",
  "scoala-11-rehab-2026": "Reabilitare Școala nr. 11",
  "piste-floresti-2026": "Extindere rețea piste ciclabile Florești",
};
