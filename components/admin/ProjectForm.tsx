"use client";

import { useEffect, useState } from "react";
import {
  BUDGET_SOURCE_OPTIONS,
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
} from "@/lib/admin-mappings";
import type { DbProject } from "@/lib/admin-types";

export interface ProjectFormValues {
  name: string;
  description_original: string;
  status: string;
  category: string;
  budget_ron: string;
  budget_source: string;
  responsible_institution: string;
  address: string;
  district: string;
  start_date: string;
  end_date: string;
  source_url: string;
  location_lat: string;
  location_lng: string;
}

export function projectToFormValues(p?: DbProject | null): ProjectFormValues {
  return {
    name: p?.name ?? "",
    description_original: p?.description_original ?? "",
    status: p?.status ?? "planned",
    category: p?.category ?? "",
    budget_ron: p?.budget_ron != null ? String(p.budget_ron) : "",
    budget_source: p?.budget_source ?? "",
    responsible_institution: p?.responsible_institution ?? "",
    address: p?.address ?? "",
    district: p?.district ?? "",
    start_date: p?.start_date ?? "",
    end_date: p?.end_date ?? "",
    source_url: p?.source_url ?? "",
    location_lat: p?.location_lat != null ? String(p.location_lat) : "",
    location_lng: p?.location_lng != null ? String(p.location_lng) : "",
  };
}

interface ProjectFormProps {
  initial?: DbProject | null;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  submitLabel: string;
  loading?: boolean;
}

export function ProjectForm({
  initial,
  onSubmit,
  submitLabel,
  loading = false,
}: ProjectFormProps) {
  const [values, setValues] = useState<ProjectFormValues>(() =>
    projectToFormValues(initial),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues(projectToFormValues(initial));
  }, [initial]);

  function set(
    key: keyof ProjectFormValues,
    value: string,
  ) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      await onSubmit(values);
    } catch (err) {
      if (err && typeof err === "object" && "errors" in err) {
        setErrors(err.errors as Record<string, string>);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = loading || submitting;

  const field = (
    label: string,
    key: keyof ProjectFormValues,
    opts?: { type?: string; required?: boolean; rows?: number },
  ) => {
    const isTextarea = opts?.rows;
    const id = `field-${key}`;
    return (
      <div key={key}>
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {opts?.required && <span className="text-red-600"> *</span>}
        </label>
        {isTextarea ? (
          <textarea
            id={id}
            rows={opts.rows}
            value={values[key]}
            onChange={(e) => set(key, e.target.value)}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#F0A500] focus:outline-none focus:ring-1 focus:ring-[#F0A500]"
          />
        ) : (
          <input
            id={id}
            type={opts?.type ?? "text"}
            required={opts?.required}
            value={values[key]}
            onChange={(e) => set(key, e.target.value)}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#F0A500] focus:outline-none focus:ring-1 focus:ring-[#F0A500]"
          />
        )}
        {errors[key] && (
          <p className="mt-1 text-xs text-red-600">{errors[key]}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {field("Denumire proiect", "name", { required: true })}
      {field("Descriere originală (text administrativ)", "description_original", {
        rows: 5,
      })}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status <span className="text-red-600">*</span>
          </label>
          <select
            value={values.status}
            onChange={(e) => set("status", e.target.value)}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="mt-1 text-xs text-red-600">{errors.status}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Categorie
          </label>
          <select
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">— Selectați —</option>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("Buget (RON)", "budget_ron", { type: "number" })}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Sursă finanțare
          </label>
          <select
            value={values.budget_source}
            onChange={(e) => set("budget_source", e.target.value)}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">— Selectați —</option>
            {BUDGET_SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {field("Instituție responsabilă", "responsible_institution")}
      {field("Adresă", "address")}
      {field("Cartier / sector", "district")}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("Data început", "start_date", { type: "date" })}
        {field("Data finalizare", "end_date", { type: "date" })}
      </div>
      {field("URL sursă", "source_url", { type: "url" })}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Coordonate GPS</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Latitudine", "location_lat", { type: "number" })}
          {field("Longitudine", "location_lng", { type: "number" })}
        </div>
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-[#F0A500] px-6 py-2.5 text-sm font-semibold text-[#0D1B2A] hover:bg-[#e09500] disabled:opacity-50"
      >
        {submitting ? "Se salvează..." : submitLabel}
      </button>
    </form>
  );
}

export async function parseApiErrors(res: Response): Promise<never> {
  const data = (await res.json()) as {
    errors?: Record<string, string>;
    error?: string;
  };
  if (data.errors) {
    throw { errors: data.errors };
  }
  throw new Error(data.error ?? "Eroare la salvare");
}

export function formValuesToPayload(values: ProjectFormValues) {
  return {
    name: values.name,
    description_original: values.description_original || null,
    status: values.status,
    category: values.category || null,
    budget_ron: values.budget_ron === "" ? null : values.budget_ron,
    budget_source: values.budget_source || null,
    responsible_institution: values.responsible_institution || null,
    address: values.address || null,
    district: values.district || null,
    start_date: values.start_date || null,
    end_date: values.end_date || null,
    source_url: values.source_url || null,
    location_lat: values.location_lat === "" ? null : values.location_lat,
    location_lng: values.location_lng === "" ? null : values.location_lng,
    source_type: "manual",
  };
}
