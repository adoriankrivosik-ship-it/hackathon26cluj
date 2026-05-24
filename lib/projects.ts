export type ProjectStatus =
  | "Inițiat"
  | "Aprobat"
  | "Bugetat"
  | "În lucru"
  | "Finalizat";

export type ProjectCategory =
  | "Infrastructură rutieră"
  | "Parcuri și spații verzi"
  | "Transport public"
  | "Educație"
  | "Utilități";

export interface PublicProject {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  budget: number;
  fundingSource: string;
  coordinates: [number, number];
  startDate: string;
  plannedEndDate: string;
  isDelayed: boolean;
  progressPercent: number;
  /** Public link for citizens to read more (from projects.source_url). */
  moreInfoUrl: string | null;
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  "Inițiat",
  "Aprobat",
  "Bugetat",
  "În lucru",
  "Finalizat",
];

export function formatBudgetRon(amount: number): string {
  return (
    new Intl.NumberFormat("ro-RO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " RON"
  );
}

export function formatDateRo(iso: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
