"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ProjectForm,
  formValuesToPayload,
  parseApiErrors,
} from "@/components/admin/ProjectForm";
import { StatusPill } from "@/components/admin/StatusPill";
import { useToast } from "@/components/admin/Toast";
import { STATUS_OPTIONS } from "@/lib/admin-mappings";
import type { DbProject } from "@/lib/admin-types";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [project, setProject] = useState<DbProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/projects/${id}`);
    if (!res.ok) {
      router.push("/admin/projects");
      return;
    }
    const data = (await res.json()) as DbProject;
    setProject(data);
    setNewStatus(data.status);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(values: Parameters<typeof formValuesToPayload>[0]) {
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValuesToPayload(values)),
    });
    if (!res.ok) await parseApiErrors(res);
    showToast("Proiect actualizat.");
    await load();
  }

  async function handleStatusUpdate() {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note: statusNote }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(data.error ?? "Eroare la actualizare.", "error");
        return;
      }
      showToast("Status actualizat.");
      setStatusNote("");
      await load();
    } finally {
      setStatusLoading(false);
    }
  }

  if (loading || !project) {
    return (
      <div className="py-12 text-center text-gray-500">Se încarcă...</div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/projects"
          className="text-sm text-gray-500 hover:text-[#0D1B2A]"
        >
          ← Proiecte
        </Link>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">{project.name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#0D1B2A]">
            Date proiect
          </h2>
          <ProjectForm
            initial={project}
            onSubmit={handleSubmit}
            submitLabel="Salvează modificările"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#0D1B2A]">
            Actualizare status
          </h2>
          <p className="mb-2 text-sm text-gray-600">Status curent</p>
          <StatusPill status={project.status} />
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status nou
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notă privind actualizarea
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Opțional..."
              />
            </div>
            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={statusLoading}
              className="w-full rounded-lg bg-[#F0A500] py-2.5 text-sm font-semibold text-[#0D1B2A] hover:bg-[#e09500] disabled:opacity-50"
            >
              {statusLoading ? "Se actualizează..." : "Actualizează status"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
