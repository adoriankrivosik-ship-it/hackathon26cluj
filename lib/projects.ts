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
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  "Inițiat",
  "Aprobat",
  "Bugetat",
  "În lucru",
  "Finalizat",
];

export const projects: PublicProject[] = [
  {
    id: "horea-rehab",
    title: "Reabilitare Strada Horea",
    description:
      "Modernizarea carosabilului și a trotuarelor pe tronsonul dintre străzile Avram Iancu și Bulevardul Eroilor. Include iluminat LED, rețele subterane și benzi dedicate bicicliștilor.",
    category: "Infrastructură rutieră",
    status: "În lucru",
    budget: 12_450_000,
    fundingSource: "Fonduri Europene (POR)",
    coordinates: [23.5872, 46.7718],
    startDate: "2024-03-15",
    plannedEndDate: "2025-11-30",
    isDelayed: true,
    progressPercent: 62,
  },
  {
    id: "piata-unirii",
    title: "Reamenajare Piața Unirii",
    description:
      "Proiect de revitalizare a pieței centrale: pavaj nou, mobilier urban, zone pietonale extinse și accesibilitate pentru persoane cu dizabilități. Faza de execuție urmează după finalizarea licitației.",
    category: "Infrastructură rutieră",
    status: "Bugetat",
    budget: 28_300_000,
    fundingSource: "Buget local + PNRR",
    coordinates: [23.5889, 46.7713],
    startDate: "2025-09-01",
    plannedEndDate: "2027-06-30",
    isDelayed: false,
    progressPercent: 18,
  },
  {
    id: "tramvai-marasti",
    title: "Extindere linie tramvai — cartier Mărăști",
    description:
      "Studiu de fezabilitate și proiect tehnic pentru prelungirea liniei de tramvai spre cartierul Mărăști, cu stații noi la intersecțiile principale. Etapa curentă: consultări publice și avize urbanistice.",
    category: "Transport public",
    status: "Inițiat",
    budget: 95_000_000,
    fundingSource: "Fonduri Europene (ITI)",
    coordinates: [23.6254, 46.7548],
    startDate: "2025-01-10",
    plannedEndDate: "2028-12-31",
    isDelayed: false,
    progressPercent: 8,
  },
  {
    id: "somes-promenada",
    title: "Promenadă pe malul Someșului",
    description:
      "Amenajarea unui traseu pietonal și ciclist de-a lungul malului Someșului Mic, între Podul Elisabeta și Parcul Feroviarilor. Include zone de odihnă și plantări noi.",
    category: "Parcuri și spații verzi",
    status: "Finalizat",
    budget: 6_780_000,
    fundingSource: "Buget local",
    coordinates: [23.5748, 46.7681],
    startDate: "2023-04-01",
    plannedEndDate: "2025-10-15",
    isDelayed: false,
    progressPercent: 100,
  },
  {
    id: "parcul-central",
    title: "Reabilitare Parcul Central „Simion Bărnuțiu”",
    description:
      "Renovarea aleilor, a sistemului de irigații și a zonei de joacă din Parcul Central. Proiectul a fost aprobat, dar execuția a fost amânată din cauza procedurilor de achiziție.",
    category: "Parcuri și spații verzi",
    status: "Aprobat",
    budget: 4_200_000,
    fundingSource: "Buget local",
    coordinates: [23.5821, 46.7662],
    startDate: "2024-06-01",
    plannedEndDate: "2025-08-31",
    isDelayed: true,
    progressPercent: 25,
  },
  {
    id: "campus-memorandumului",
    title: "Extindere campus universitar — Strada Memorandumului",
    description:
      "Construcția unei clădiri noi pentru laboratoare și săli de curs la Universitatea Tehnică, cu eficiență energetică ridicată. Lucrările de fundație sunt în desfășurare.",
    category: "Educație",
    status: "În lucru",
    budget: 42_500_000,
    fundingSource: "Fonduri Europene (POR) + cofinanțare locală",
    coordinates: [23.5915, 46.7694],
    startDate: "2024-11-01",
    plannedEndDate: "2026-09-30",
    isDelayed: false,
    progressPercent: 48,
  },
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
