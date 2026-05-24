import { formatDateRo, statusLabel } from "@/lib/admin-mappings";
import { listLedgerEntries } from "@/lib/db";

export default async function AdminLedgerPage() {
  const entries = await listLedgerEntries(200);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#0D1B2A]">
        Registru audit
      </h1>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Acțiune</th>
              <th className="px-4 py-3">Proiect</th>
              <th className="px-4 py-3">De la → La</th>
              <th className="px-4 py-3">Autor</th>
              <th className="hidden px-4 py-3 lg:table-cell">Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Nicio înregistrare în registru.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatDateRo(e.timestamp)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{e.action_type}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {e.project_id ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {e.old_value && e.new_value ? (
                      <>
                        {e.action_type.includes("status")
                          ? `${statusLabel(e.old_value)} → ${statusLabel(e.new_value)}`
                          : `${e.old_value} → ${e.new_value}`}
                      </>
                    ) : (
                      e.new_value ?? e.old_value ?? "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{e.changed_by}</td>
                  <td className="hidden max-w-[120px] truncate px-4 py-3 font-mono text-xs text-gray-400 lg:table-cell">
                    {e.entry_hash.slice(0, 12)}…
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
