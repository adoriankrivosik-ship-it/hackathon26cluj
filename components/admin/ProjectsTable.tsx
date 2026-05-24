"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  categoryLabel,
  formatBudgetRon,
  formatDateRo,
} from "@/lib/admin-mappings";
import type { DbProject } from "@/lib/admin-types";
import { StatusPill } from "./StatusPill";

interface ProjectsTableProps {
  projects: DbProject[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter((p) => {
      if (category && p.category !== category) return false;
      if (status && p.status !== status) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.district?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [projects, search, category, status]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input
            type="search"
            placeholder="Căutare proiecte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Toate categoriile</option>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Toate statusurile</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/projects/import"
            className="rounded-lg border-2 border-[#0D1B2A] px-4 py-2 text-sm font-semibold text-[#0D1B2A] hover:bg-[#0D1B2A]/5"
          >
            Import AI
          </Link>
          <Link
            href="/admin/projects/new"
            className="rounded-lg bg-[#F0A500] px-4 py-2 text-sm font-semibold text-[#0D1B2A] hover:bg-[#e09500]"
          >
            Adaugă proiect
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nume</th>
              <th className="hidden px-4 py-3 md:table-cell">Categorie</th>
              <th className="px-4 py-3">Status</th>
              <th className="hidden px-4 py-3 lg:table-cell">Buget (RON)</th>
              <th className="hidden px-4 py-3 sm:table-cell">Actualizat</th>
              <th className="px-4 py-3">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Niciun proiect găsit.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.name}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    {categoryLabel(p.category)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {formatBudgetRon(p.budget_ron)}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                    {formatDateRo(p.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="text-sm font-medium text-[#0D1B2A] underline hover:text-[#F0A500]"
                    >
                      Editează
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {filtered.length} din {projects.length} proiecte
      </p>
    </div>
  );
}
