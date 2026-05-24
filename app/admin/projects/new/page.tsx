"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ProjectForm,
  formValuesToPayload,
  parseApiErrors,
} from "@/components/admin/ProjectForm";
import { useToast } from "@/components/admin/Toast";

export default function NewProjectPage() {
  const router = useRouter();
  const { showToast } = useToast();

  async function handleSubmit(values: Parameters<typeof formValuesToPayload>[0]) {
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValuesToPayload(values)),
    });
    if (!res.ok) await parseApiErrors(res);
    const data = (await res.json()) as { id: string };
    showToast("Proiect creat cu succes.");
    router.push(`/admin/projects/${data.id}`);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/projects"
          className="text-sm text-gray-500 hover:text-[#0D1B2A]"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Adaugă proiect</h1>
      </div>
      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ProjectForm
          onSubmit={handleSubmit}
          submitLabel="Salvează proiect"
        />
      </div>
    </div>
  );
}
