"use client";

import { useEffect, useRef, useState } from "react";
import {
  ProjectForm,
  formValuesToPayload,
  parseApiErrors,
  type ProjectFormValues,
} from "@/components/admin/ProjectForm";
import {
  ImportProgress,
  type ImportPhase,
} from "@/components/admin/ImportProgress";
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
  const [phase, setPhase] = useState<ImportPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>();
  const [cards, setCards] = useState<DbProject[]>([]);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  function stopProgressTimer() {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }

  function startProgressTimer(from: number, to: number, ms = 400) {
    stopProgressTimer();
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= to) {
          stopProgressTimer();
          return to;
        }
        return Math.min(to, p + 2);
      });
    }, ms);
    setProgress(from);
  }

  function resetProgress() {
    stopProgressTimer();
    setPhase("idle");
    setProgress(0);
    setStatusMessage(undefined);
  }

  async function runExtraction(
    request: () => Promise<Response>,
    sourceLabel: string,
  ) {
    setLoading(true);
    setCards([]);
    setPhase("fetch");
    setStatusMessage(`Se descarcă ${sourceLabel}…`);
    startProgressTimer(8, 35);

    try {
      setPhase("analyze");
      setStatusMessage("AI analizează conținutul (poate dura până la 2 minute)…");
      startProgressTimer(36, 88, 600);

      const res = await request();
      const data = (await res.json()) as {
        error?: string;
        hint?: string;
        projects?: ExtractedProject[];
      };

      setPhase("finalize");
      setStatusMessage("Se pregătesc formularele…");
      startProgressTimer(89, 98, 200);

      if (!res.ok) {
        throw new Error(data.error ?? "Extragere eșuată");
      }

      const projects = data.projects ?? [];
      setCards(projects.map(extractedToDbShape));

      stopProgressTimer();
      setProgress(100);

      if (projects.length === 0) {
        setPhase("error");
        setStatusMessage(
          data.hint ??
            "Nu s-au găsit proiecte în document. Verificați sursa sau încercați PDF.",
        );
        showToast("Niciun proiect identificat.", "error");
      } else {
        setPhase("done");
        setStatusMessage(
          `${projects.length} proiect${projects.length === 1 ? "" : "e"} găsit${projects.length === 1 ? "" : "e"}. Revizuiți și salvați.`,
        );
        showToast(`${projects.length} proiect(e) extrase.`);
      }
    } catch (e) {
      stopProgressTimer();
      setPhase("error");
      setProgress(0);
      const msg =
        e instanceof Error ? e.message : "Extragere eșuată. Încercați din nou.";
      setStatusMessage(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  async function extractFromUrl() {
    if (!url.trim()) {
      showToast("Introduceți un URL.", "error");
      return;
    }
    await runExtraction(
      () =>
        fetch("/api/admin/import/url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        }),
      "pagina web",
    );
  }

  async function extractFromPdf(file: File) {
    const buf = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ""),
    );

    await runExtraction(
      () =>
        fetch("/api/admin/import/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, fileName: file.name }),
        }),
      `PDF „${file.name}"`,
    );
  }

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(["url", "pdf"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              if (!loading) resetProgress();
            }}
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
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) extractFromUrl();
            }}
          />
          <button
            type="button"
            onClick={extractFromUrl}
            disabled={loading}
            className="rounded-lg bg-[#0D1B2A] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1a2d42] disabled:opacity-50"
          >
            {loading ? "Se extrage…" : "Extrage date"}
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
              e.target.value = "";
            }}
            className="text-sm disabled:opacity-60"
          />
        </div>
      )}

      <ImportProgress
        phase={phase}
        progress={progress}
        message={statusMessage}
      />

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
