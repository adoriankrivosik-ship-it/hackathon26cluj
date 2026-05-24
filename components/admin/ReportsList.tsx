"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatDateRo } from "@/lib/admin-mappings";
import type { DbIssueReport, IssueStatusDb } from "@/lib/admin-types";
import { useToast } from "./Toast";

const TABS: { key: IssueStatusDb | "all"; label: string }[] = [
  { key: "all", label: "Toate" },
  { key: "open", label: "Deschise" },
  { key: "in_progress", label: "În lucru" },
  { key: "resolved", label: "Rezolvate" },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Deschis" },
  { value: "in_progress", label: "În lucru" },
  { value: "resolved", label: "Rezolvat" },
];

function ReportCard({
  report,
  onUpdated,
}: {
  report: DbIssueReport;
  onUpdated: () => void;
}) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<IssueStatusDb>(
    (report.status as IssueStatusDb) ?? "open",
  );
  const [note, setNote] = useState(report.resolution_note ?? "");
  const [loading, setLoading] = useState(false);

  async function update() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${report.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution_note: note }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(data.error ?? "Eroare", "error");
        return;
      }
      showToast("Sesizare actualizată.");
      onUpdated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row">
        {report.photo_url && (
          <img
            src={report.photo_url}
            alt=""
            className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-[#0D1B2A]">{report.title}</h3>
          {report.description && (
            <p className="mt-1 text-sm text-gray-600">{report.description}</p>
          )}
          <dl className="mt-2 grid gap-1 text-xs text-gray-500 sm:grid-cols-2">
            {report.category && (
              <div>
                <dt className="inline font-medium">Categorie: </dt>
                <dd className="inline">{report.category}</dd>
              </div>
            )}
            {report.address && (
              <div>
                <dt className="inline font-medium">Adresă: </dt>
                <dd className="inline">{report.address}</dd>
              </div>
            )}
            <div>
              <dt className="inline font-medium">Trimis: </dt>
              <dd className="inline">{formatDateRo(report.submitted_at)}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Status: </dt>
              <dd className="inline capitalize">{report.status ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-end">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as IssueStatusDb)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notă rezolvare..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={update}
          disabled={loading}
          className="rounded-lg bg-[#F0A500] px-4 py-2 text-sm font-semibold text-[#0D1B2A] disabled:opacity-50"
        >
          {loading ? "..." : "Actualizează"}
        </button>
      </div>
    </article>
  );
}

export function ReportsList({ reports }: { reports: DbIssueReport[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<IssueStatusDb | "all">("all");

  const filtered = useMemo(() => {
    if (tab === "all") return reports;
    return reports.filter((r) => (r.status ?? "open") === tab);
  }, [reports, tab]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t.key
                ? "bg-[#0D1B2A] text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Nicio sesizare în această categorie.
          </p>
        ) : (
          filtered.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onUpdated={() => router.refresh()}
            />
          ))
        )}
      </div>
    </div>
  );
}
