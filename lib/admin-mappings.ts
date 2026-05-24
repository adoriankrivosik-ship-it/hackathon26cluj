import type {
  BudgetSourceDb,
  ProjectCategoryDb,
  ProjectStatusDb,
} from "./admin-types";

export const STATUS_OPTIONS: {
  value: ProjectStatusDb;
  label: string;
}[] = [
  { value: "planned", label: "Planificat" },
  { value: "procurement", label: "Achiziții" },
  { value: "starting", label: "Începe" },
  { value: "continuing", label: "În desfășurare" },
  { value: "finalizing", label: "Finalizare" },
  { value: "delayed", label: "Întârziat" },
  { value: "completed", label: "Finalizat" },
];

export const CATEGORY_OPTIONS: {
  value: ProjectCategoryDb;
  label: string;
}[] = [
  { value: "mobility", label: "Mobilitate" },
  { value: "education", label: "Educație" },
  { value: "green", label: "Spații verzi" },
  { value: "social", label: "Social" },
  { value: "cultural", label: "Patrimoniu" },
  { value: "energy", label: "Energie" },
  { value: "housing", label: "Locuințe" },
  { value: "waste", label: "Deșeuri" },
];

export const BUDGET_SOURCE_OPTIONS: {
  value: BudgetSourceDb;
  label: string;
}[] = [
  { value: "local", label: "Local" },
  { value: "european", label: "European" },
  { value: "national", label: "Național" },
  { value: "mixed", label: "Mixt" },
];

const STATUS_LABEL: Record<ProjectStatusDb, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ProjectStatusDb, string>;

const CATEGORY_LABEL: Record<ProjectCategoryDb, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ProjectCategoryDb, string>;

export function statusLabel(status: string): string {
  return STATUS_LABEL[status as ProjectStatusDb] ?? status;
}

export function categoryLabel(category: string | null): string {
  if (!category) return "—";
  return CATEGORY_LABEL[category as ProjectCategoryDb] ?? category;
}

export function formatBudgetRon(amount: number | null): string {
  if (amount == null) return "—";
  return (
    new Intl.NumberFormat("ro-RO", {
      maximumFractionDigits: 0,
    }).format(amount) + " RON"
  );
}

export function formatDateRo(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export const STATUS_PILL_CLASSES: Record<ProjectStatusDb, string> = {
  planned: "bg-gray-200 text-gray-800",
  procurement: "bg-blue-100 text-blue-800",
  starting: "bg-yellow-100 text-yellow-900",
  continuing: "bg-sky-100 text-sky-900",
  finalizing: "bg-orange-100 text-orange-900",
  delayed: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
};

export const ISSUE_STATUS_OPTIONS = [
  { value: "open", label: "Deschis" },
  { value: "in_progress", label: "În lucru" },
  { value: "resolved", label: "Rezolvat" },
] as const;
