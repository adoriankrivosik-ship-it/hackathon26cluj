import {
  auditActionLabel,
  auditFieldLabel,
  formatBudgetRon,
  formatDateTimeRo,
  statusLabel,
} from "@/lib/admin-mappings";
import {
  AUDIT_LEDGER_SEED,
  AUDIT_PROJECT_LABELS,
  verifyAuditRows,
  type AuditLedgerRow,
} from "@/lib/audit-ledger-core";

export const dynamic = "force-dynamic";
export const runtime = "edge";

function formatAuditValue(
  field: string | null,
  value: string | null,
): string {
  if (value == null || value === "") return "—";
  if (field === "status") return statusLabel(value);
  if (field === "budget_ron") {
    const n = Number(value);
    return Number.isFinite(n) ? formatBudgetRon(n) : value;
  }
  return value;
}

function projectLabel(entityId: string): string {
  return AUDIT_PROJECT_LABELS[entityId] ?? entityId;
}

async function loadAuditEntries(): Promise<AuditLedgerRow[]> {
  if (process.env.CF_PAGES === "1") {
    const { getCloudflareDatabase } = await import("@/lib/get-database.cloudflare");
    const db = getCloudflareDatabase();
    const { results } = await db
      .prepare(
        `SELECT * FROM audit_ledger ORDER BY timestamp DESC, id DESC LIMIT 500`,
      )
      .all<AuditLedgerRow>();
    if (results?.length) return results;
  }

  return [...AUDIT_LEDGER_SEED].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );
}

async function loadChainVerification(): Promise<{
  valid: boolean;
  brokenAtId: number | null;
}> {
  if (process.env.CF_PAGES === "1") {
    const { getCloudflareDatabase } = await import("@/lib/get-database.cloudflare");
    const db = getCloudflareDatabase();
    const { results } = await db
      .prepare(`SELECT * FROM audit_ledger ORDER BY id ASC`)
      .all<AuditLedgerRow>();
    if (results?.length) return verifyAuditRows(results);
  }

  return verifyAuditRows(AUDIT_LEDGER_SEED);
}

export default async function AdminAuditPage() {
  const [entries, chain] = await Promise.all([
    loadAuditEntries(),
    loadChainVerification(),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">
            Registru audit imutabil
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Jurnal criptografic al modificărilor de proiect — doar adăugare,
            fără ștergere sau editare.
          </p>
        </div>

        <div
          role="status"
          aria-live="polite"
          className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold ${
            chain.valid
              ? "bg-green-100 text-green-800 ring-1 ring-green-200"
              : "bg-red-100 text-red-800 ring-1 ring-red-200"
          }`}
        >
          {chain.valid ? (
            <>
              <span aria-hidden="true">✓</span>
              Lanț verificat
            </>
          ) : (
            <>
              <span aria-hidden="true">✗</span>
              Lanț compromis
              {chain.brokenAtId != null && (
                <span className="font-normal"> (ID #{chain.brokenAtId})</span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">
            Registru audit imutabil al modificărilor de proiect
          </caption>
          <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" className="px-3 py-3 sm:px-4">
                <span className="sr-only">Imutabil</span>
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-3 sm:px-4">
                Data/ora
              </th>
              <th scope="col" className="px-3 py-3 sm:px-4">
                Utilizator
              </th>
              <th scope="col" className="px-3 py-3 sm:px-4">
                Acțiune
              </th>
              <th scope="col" className="px-3 py-3 sm:px-4">
                Proiect
              </th>
              <th scope="col" className="hidden px-3 py-3 md:table-cell sm:px-4">
                Câmp modificat
              </th>
              <th scope="col" className="hidden px-3 py-3 lg:table-cell sm:px-4">
                Valoare veche
              </th>
              <th scope="col" className="hidden px-3 py-3 lg:table-cell sm:px-4">
                Valoare nouă
              </th>
              <th scope="col" className="px-3 py-3 sm:px-4">
                Hash
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Nicio înregistrare în registrul audit.
                </td>
              </tr>
            ) : (
              entries.map((row) => <AuditRow key={row.id} row={row} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditRow({ row }: { row: AuditLedgerRow }) {
  return (
    <tr className="hover:bg-gray-50/80">
      <td
        className="px-3 py-3 text-gray-400 sm:px-4"
        title="Înregistrare imutabilă"
      >
        <span aria-label="Înregistrare imutabilă" role="img">
          🔒
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-gray-600 sm:px-4">
        <time dateTime={row.timestamp}>{formatDateTimeRo(row.timestamp)}</time>
      </td>
      <td className="px-3 py-3 font-medium text-[#0D1B2A] sm:px-4">
        {row.user_label}
      </td>
      <td className="px-3 py-3 sm:px-4">
        <span className="rounded-md bg-[#0D1B2A]/5 px-2 py-0.5 text-xs font-medium text-[#0D1B2A]">
          {auditActionLabel(row.action)}
        </span>
      </td>
      <td className="max-w-[140px] truncate px-3 py-3 text-gray-700 sm:max-w-none sm:px-4">
        <span title={row.entity_id}>{projectLabel(row.entity_id)}</span>
      </td>
      <td className="hidden px-3 py-3 text-gray-600 md:table-cell sm:px-4">
        {auditFieldLabel(row.field_changed)}
      </td>
      <td className="hidden max-w-[120px] truncate px-3 py-3 text-gray-500 lg:table-cell sm:px-4">
        {formatAuditValue(row.field_changed, row.old_value)}
      </td>
      <td className="hidden max-w-[120px] truncate px-3 py-3 text-gray-800 lg:table-cell sm:px-4">
        {formatAuditValue(row.field_changed, row.new_value)}
      </td>
      <td
        className="px-3 py-3 font-mono text-xs text-gray-400 sm:px-4"
        title={row.data_hash}
      >
        {row.data_hash.slice(0, 8)}…
      </td>
    </tr>
  );
}
