"use client";

import { useState } from "react";
import {
  ProjectForm,
  formValuesToPayload,
  parseApiErrors,
  type ProjectFormValues,
} from "@/components/admin/ProjectForm";
import { useToast } from "@/components/admin/Toast";
import type { DbProject, ExtractedProject } from "@/lib/admin-types";

type Tab = "url" | "pdf";

function extractedToDbShape(p: ExtractedProject): DbProject {
  return {
    id: "",
    name: p.name ?? "",
    description_original: p.description_original ?? null,
    description_plain: null,
    status: (p.status as DbProject["status"]) || "planned",
    category: (p.category as DbProject["category"]) || null,
    budget_ron: p.budget_ron ?? null,
    budget_source: null,
    responsible_institution: p.responsible_institution ?? null,
    location_lat: null,
    location_lng: null,
    address: p.address ?? null,
    district: null,
    start_date: p.start_date ?? null,
    end_date: p.end_date ?? null,
    source_url: p.source_url ?? null,
    source_type: "webpage",
    created_at: "",
    updated_at: "",
    created_by: null,
  };
}

function ImportCard({
  initial,
  index,
  onSaved,
}: {
  initial: DbProject;
  index: number;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  async function save(values: ProjectFormValues) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValuesToPayload(values)),
      });
      if (!res.ok) await parseApiErrors(res);
      showToast(`Proiect „${values.name}” salvat.`);
      onSaved();
    } catch {
      showToast("Verificați câmpurile formularului.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-[#0D1B2A]">
        Proiect extras #{index + 1}: {initial.name}
      </h3>
      <ProjectForm
        initial={initial}
        onSubmit={save}
        submitLabel={saving ? "Se salvează..." : "Salvează proiect"}
        loading={saving}
      />
    </div>
  );
}

export function ImportProjects() {
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<DbProject[]>([]);
  const { showToast } = useToast();

  async function extractFromUrl() {
    if (!url.trim()) {
      showToast("Introduceți un URL.", "error");
      return;
    }
    setLoading(true);
    setCards([]);
    try {
      const res = await fetch("/api/admin/import/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as {
        error?: string;
        projects?: ExtractedProject[];
      };
      if (!res.ok) {
        showToast(data.error ?? "Extragere eșuată", "error");
        return;
      }
      const projects = data.projects ?? [];
      setCards(projects.map(extractedToDbShape));
      if (projects.length === 0) {
        showToast("Nu s-au găsit proiecte în document.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function extractFromPdf(file: File) {
    setLoading(true);
    setCards([]);
    try {
      const buf = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buf).reduce(
          (s, b) => s + String.fromCharCode(b),
          "",
        ),
      );
      const res = await fetch("/api/admin/import/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, fileName: file.name }),
      });
      const data = (await res.json()) as {
        error?: string;
        projects?: ExtractedProject[];
      };
      if (!res.ok) {
        showToast(data.error ?? "Extragere eșuată", "error");
        return;
      }
      const projects = data.projects ?? [];
      setCards(projects.map(extractedToDbShape));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(["url", "pdf"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t
                ? "border-[#F0A500] text-[#0D1B2A]"
                : "border-transparent text-gray-500"
            }`}
          >
            {t === "url" ? "URL" : "PDF"}
          </button>
        ))}
      </div>

      {tab === "url" ? (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.primariaclujnapoca.ro/..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={extractFromUrl}
            disabled={loading}
            className="rounded-lg bg-[#0D1B2A] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1a2d42] disabled:opacity-50"
          >
            Extrage date
          </button>
        </div>
      ) : (
        <div className="mb-6">
          <input
            type="file"
            accept=".pdf,application/pdf"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) extractFromPdf(f);
            }}
            className="text-sm"
          />
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-lg bg-[#0D1B2A]/5 px-4 py-8 text-center text-[#0D1B2A]">
          <p className="font-medium">Se extrag datele din document...</p>
        </div>
      )}

      <div className="space-y-6">
        {cards.map((card, i) => (
          <ImportCard
            key={`${card.name}-${i}`}
            initial={card}
            index={i}
            onSaved={() => setCards((list) => list.filter((_, j) => j !== i))}
          />
        ))}
      </div>
    </div>
  );
}
