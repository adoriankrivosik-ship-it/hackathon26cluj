import "server-only";

import { getRequestContext } from "@cloudflare/next-on-pages";

import type {
  ProjectCategory,
  ProjectStatus,
  PublicProject,
} from "./projects";

/** Row shape from D1 `projects` table (snake_case). */
interface ProjectRow {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  budget: number;
  funding_source: string;
  lng: number;
  lat: number;
  start_date: string;
  planned_end_date: string;
  progress_percent: number;
  is_delayed: number;
}

interface WalkPinRow {
  id: string;
  lng: number;
  lat: number;
  isochrone_geojson: string;
  amenities_json: string;
  scores_json: string;
  overall_score: number;
  created_at: string;
}

function mapRow(row: ProjectRow): PublicProject {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as ProjectCategory,
    status: row.status as ProjectStatus,
    budget: row.budget,
    fundingSource: row.funding_source,
    coordinates: [row.lng, row.lat],
    startDate: row.start_date,
    plannedEndDate: row.planned_end_date,
    isDelayed: row.is_delayed === 1,
    progressPercent: row.progress_percent,
  };
}

const MOCK_PROJECT_ROWS: ProjectRow[] = [
  {
    id: "horea-rehab",
    title: "Reabilitare Strada Horea",
    description:
      "Modernizarea carosabilului și a trotuarelor pe tronsonul dintre străzile Avram Iancu și Bulevardul Eroilor. Include iluminat LED, rețele subterane și benzi dedicate bicicliștilor.",
    category: "Infrastructură rutieră",
    status: "În lucru",
    budget: 12450000,
    funding_source: "Fonduri Europene (POR)",
    lng: 23.5872,
    lat: 46.7718,
    start_date: "2024-03-15",
    planned_end_date: "2025-11-30",
    progress_percent: 62,
    is_delayed: 1,
  },
  {
    id: "piata-unirii",
    title: "Reamenajare Piața Unirii",
    description:
      "Proiect de revitalizare a pieței centrale: pavaj nou, mobilier urban, zone pietonale extinse și accesibilitate pentru persoane cu dizabilități. Faza de execuție urmează după finalizarea licitației.",
    category: "Infrastructură rutieră",
    status: "Bugetat",
    budget: 28300000,
    funding_source: "Buget local + PNRR",
    lng: 23.5889,
    lat: 46.7713,
    start_date: "2025-09-01",
    planned_end_date: "2027-06-30",
    progress_percent: 18,
    is_delayed: 0,
  },
  {
    id: "tramvai-marasti",
    title: "Extindere linie tramvai — cartier Mărăști",
    description:
      "Studiu de fezabilitate și proiect tehnic pentru prelungirea liniei de tramvai spre cartierul Mărăști, cu stații noi la intersecțiile principale. Etapa curentă: consultări publice și avize urbanistice.",
    category: "Transport public",
    status: "Inițiat",
    budget: 95000000,
    funding_source: "Fonduri Europene (ITI)",
    lng: 23.6254,
    lat: 46.7548,
    start_date: "2025-01-10",
    planned_end_date: "2028-12-31",
    progress_percent: 8,
    is_delayed: 0,
  },
  {
    id: "somes-promenada",
    title: "Promenadă pe malul Someșului",
    description:
      "Amenajarea unui traseu pietonal și ciclist de-a lungul malului Someșului Mic, între Podul Elisabeta și Parcul Feroviarilor. Include zone de odihnă și plantări noi.",
    category: "Parcuri și spații verzi",
    status: "Finalizat",
    budget: 6780000,
    funding_source: "Buget local",
    lng: 23.5748,
    lat: 46.7681,
    start_date: "2023-04-01",
    planned_end_date: "2025-10-15",
    progress_percent: 100,
    is_delayed: 0,
  },
  {
    id: "parcul-central",
    title: "Reabilitare Parcul Central „Simion Bărnuțiu”",
    description:
      "Renovarea aleilor, a sistemului de irigații și a zonei de joacă din Parcul Central. Proiectul a fost aprobat, dar execuția a fost amânată din cauza procedurilor de achiziție.",
    category: "Parcuri și spații verzi",
    status: "Aprobat",
    budget: 4200000,
    funding_source: "Buget local",
    lng: 23.5821,
    lat: 46.7662,
    start_date: "2024-06-01",
    planned_end_date: "2025-08-31",
    progress_percent: 25,
    is_delayed: 1,
  },
  {
    id: "campus-memorandumului",
    title: "Extindere campus universitar — Strada Memorandumului",
    description:
      "Construcția unei clădiri noi pentru laboratoare și săli de curs la Universitatea Tehnică, cu eficiență energetică ridicată. Lucrările de fundație sunt în desfășurare.",
    category: "Educație",
    status: "În lucru",
    budget: 42500000,
    funding_source: "Fonduri Europene (POR) + cofinanțare locală",
    lng: 23.5915,
    lat: 46.7694,
    start_date: "2024-11-01",
    planned_end_date: "2026-09-30",
    progress_percent: 48,
    is_delayed: 0,
  },
];

const WALK_COUNT_CAPS: Record<string, number> = {
  education: 6,
  health: 8,
  commercial: 8,
  culture: 5,
  transport: 12,
  parks: 5,
  sport: 5,
  banking: 4,
  food: 8,
};

function walkScoreFromCount(count: number, cap: number): number {
  if (cap <= 0) return 0;
  return Math.min(100, Math.round((count / cap) * 100));
}

function walkOverallFromScores(scores: Record<string, number>): number {
  const keys = Object.keys(WALK_COUNT_CAPS);
  const sum = keys.reduce((acc, k) => acc + scores[k], 0);
  return Math.round(sum / keys.length);
}

function walkHexRing(lng: number, lat: number, r = 0.011): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 2 * Math.PI;
    coords.push([lng + r * Math.cos(a), lat + r * 0.75 * Math.sin(a)]);
  }
  coords.push(coords[0]);
  return coords;
}

function buildMockWalkPins(): WalkPinRow[] {
  const createdAt = "2024-01-01T00:00:00.000Z";
  const seeds: {
    id: string;
    lng: number;
    lat: number;
    amenityOffsets: [string, string | null, string, number, number][];
  }[] = [
    {
      id: "walk-centru",
      lng: 23.5889,
      lat: 46.7713,
      amenityOffsets: [
        ["education", "school", "Școala Centrală", 0.002, 0.001],
        ["education", "kindergarten", "Grădiniță", 0.003, 0.002],
        ["education", "university", "Universitate", -0.002, 0.003],
        ["parks", null, "Parcul Central", -0.003, -0.002],
        ["parks", null, "Grădina Botanică", -0.004, -0.001],
        ["transport", null, "Stație autobuz", 0.001, -0.001],
        ["transport", null, "Stație tramvai", 0.002, -0.002],
        ["transport", null, "Platformă", 0.0015, -0.0015],
        ["commercial", "supermarket", "Supermarket", -0.001, 0.002],
        ["commercial", "convenience", "Magazin", 0.001, 0.001],
        ["health", "pharmacy", "Farmacie", 0.002, -0.002],
        ["health", "clinic_doctors", "Clinică", -0.001, -0.002],
        ["culture", "theatre", "Teatru", -0.002, 0.001],
        ["culture", "museum", "Muzeu", -0.0025, 0.0015],
        ["culture", "library", "Bibliotecă", 0.002, 0.002],
        ["sport", "fitness_centre", "Sală fitness", 0.003, -0.001],
        ["sport", "sports_centre", "Polivalentă", -0.002, 0.002],
        ["banking", "bank", "BCR", 0.001, 0.002],
        ["banking", "atm", "ATM", -0.001, 0.001],
        ["food", "restaurant", "Restaurant", 0.002, 0.001],
        ["food", "cafe", "Cafenea", -0.002, 0.002],
        ["food", "fast_food", "Fast-food", 0.001, -0.001],
      ],
    },
    {
      id: "walk-manastur",
      lng: 23.555,
      lat: 46.762,
      amenityOffsets: [
        ["transport", null, "Stație tramvai", 0.002, 0],
        ["transport", null, "Stație autobuz", 0.001, 0.001],
        ["commercial", "convenience", "Magazin alimentar", -0.002, 0.001],
        ["commercial", "supermarket", "Supermarket", -0.003, 0.002],
        ["education", "school", "Liceu", 0.001, -0.002],
        ["education", "kindergarten", "Grădiniță", 0.002, -0.001],
        ["health", "pharmacy", "Farmacie", -0.001, 0.002],
        ["parks", null, "Parc mic", 0.002, 0.002],
        ["sport", "pitch", "Teren sport", 0.003, 0.001],
        ["banking", "atm", "ATM", -0.002, 0.001],
        ["food", "fast_food", "Fast-food", 0.001, -0.002],
      ],
    },
    {
      id: "walk-iris",
      lng: 23.638,
      lat: 46.782,
      amenityOffsets: [
        ["transport", null, "Stație autobuz", 0.001, 0.001],
        ["transport", null, "Stație", -0.001, 0.002],
        ["commercial", "convenience", "Magazin", -0.001, -0.001],
        ["commercial", "convenience", "Magazin 2", 0.002, -0.001],
        ["education", "school", "Școală", 0.001, -0.002],
        ["health", "pharmacy", "Farmacie", -0.002, 0.001],
        ["parks", null, "Spațiu verde", 0.002, 0.002],
        ["food", "cafe", "Cafenea", 0.001, 0.001],
      ],
    },
    {
      id: "walk-gheorgheni",
      lng: 23.615,
      lat: 46.752,
      amenityOffsets: [
        ["parks", null, "Parc Gheorgheni", 0.002, 0.002],
        ["parks", null, "Parc mic", -0.001, 0.003],
        ["transport", null, "Stație", -0.001, 0.001],
        ["transport", null, "Tramvai", 0.002, 0],
        ["commercial", "supermarket", "Supermarket", 0.002, -0.001],
        ["commercial", "convenience", "Magazin", -0.001, -0.002],
        ["health", "clinic_doctors", "Clinică", -0.002, -0.001],
        ["health", "pharmacy", "Farmacie", 0.001, -0.002],
        ["education", "school", "Școală", 0.002, 0.001],
        ["education", "kindergarten", "Grădiniță", -0.002, 0.002],
        ["sport", "fitness_centre", "Fitness", 0.003, 0.001],
        ["culture", "library", "Bibliotecă", -0.002, 0.001],
        ["banking", "bank", "Bancă", 0.002, 0.001],
        ["food", "restaurant", "Restaurant", -0.001, 0.002],
        ["food", "cafe", "Cafenea", 0.002, -0.001],
      ],
    },
  ];

  return seeds.map((s) => {
    const amenities = s.amenityOffsets.map(
      ([category, subcategory, name, dLng, dLat]) => ({
        category,
        ...(subcategory ? { subcategory } : {}),
        name,
        lng: s.lng + dLng,
        lat: s.lat + dLat,
      }),
    );

    const counts = Object.fromEntries(
      Object.keys(WALK_COUNT_CAPS).map((k) => [
        k,
        amenities.filter((a) => a.category === k).length,
      ]),
    );

    const scores = Object.fromEntries(
      Object.entries(WALK_COUNT_CAPS).map(([k, cap]) => [
        k,
        walkScoreFromCount(counts[k], cap),
      ]),
    );

    const overall = walkOverallFromScores(scores);

    return {
      id: s.id,
      lng: s.lng,
      lat: s.lat,
      isochrone_geojson: JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [walkHexRing(s.lng, s.lat)],
            },
            properties: { contour: 15 },
          },
        ],
      }),
      amenities_json: JSON.stringify(amenities),
      scores_json: JSON.stringify(scores),
      overall_score: overall,
      created_at: createdAt,
    };
  });
}

function createMockD1Database(): D1Database {
  const walkPins = buildMockWalkPins();

  return {
    prepare(query: string) {
      const normalized = query.replace(/\s+/g, " ").trim().toLowerCase();

      return {
        bind: (...values: unknown[]) => ({
          all: async <T>() => {
            if (normalized.includes("from walk_pins")) {
              return { results: walkPins as T[], success: true as const };
            }
            return { results: [] as T[], success: true as const };
          },
          first: async <T>() => null as T | null,
          run: async () => {
            if (normalized.includes("insert into walk_pins")) {
              walkPins.push({
                id: values[0] as string,
                lng: values[1] as number,
                lat: values[2] as number,
                isochrone_geojson: values[3] as string,
                amenities_json: values[4] as string,
                scores_json: values[5] as string,
                overall_score: values[6] as number,
                created_at: values[7] as string,
              });
            }
            return { success: true as const };
          },
        }),
        all: async <T>() => {
          if (normalized.includes("from projects")) {
            return { results: MOCK_PROJECT_ROWS as T[], success: true as const };
          }
          if (normalized.includes("from walk_pins")) {
            return { results: walkPins as T[], success: true as const };
          }
          return { results: [] as T[], success: true as const };
        },
        first: async <T>() => null as T | null,
        run: async () => ({ success: true as const }),
      };
    },
  } as unknown as D1Database;
}

function isCloudflarePagesRuntime(): boolean {
  return process.env.CF_PAGES === "1";
}

/** Load all projects from a D1 binding. */
export async function getProjects(db: D1Database): Promise<PublicProject[]> {
  const { results } = await db
    .prepare("SELECT * FROM projects ORDER BY id")
    .all<ProjectRow>();

  return (results ?? []).map(mapRow);
}

/** Resolve the local/production D1 binding and fetch projects. */
export async function loadProjects(): Promise<PublicProject[]> {
  const db = await getDatabase();
  return getProjects(db);
}

export async function getDatabase(): Promise<D1Database> {
  if (isCloudflarePagesRuntime()) {
    return getRequestContext().env.DB;
  }

  return createMockD1Database();
}
