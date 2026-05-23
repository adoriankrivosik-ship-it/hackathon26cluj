/** Top-level walkability categories stored in D1 `scores_json`. */
export type WalkCategoryKey =
  | "education"
  | "health"
  | "commercial"
  | "culture"
  | "transport"
  | "parks"
  | "sport";

/** OSM-derived subcategory keys (breakdown in UI where defined). */
export type WalkSubcategoryKey =
  | "kindergarten"
  | "school"
  | "university"
  | "pharmacy"
  | "clinic_doctors"
  | "hospital"
  | "dentist"
  | "convenience"
  | "supermarket"
  | "library"
  | "museum"
  | "theatre"
  | "cinema"
  | "arts_centre"
  | "fitness_centre"
  | "sports_centre"
  | "pitch";

export interface WalkSubcategoryDef {
  key: WalkSubcategoryKey;
  label: string;
}

export interface WalkCategoryDef {
  key: WalkCategoryKey;
  label: string;
  /** Total count in category at or above this → sub-score 100 */
  countCap: number;
  weight: number;
  color: string;
  subcategories?: WalkSubcategoryDef[];
}

export const WALK_CATEGORIES: WalkCategoryDef[] = [
  {
    key: "education",
    label: "Educație",
    countCap: 6,
    weight: 1,
    color: "#3b82f6",
    subcategories: [
      { key: "kindergarten", label: "Grădinițe" },
      { key: "school", label: "Școli" },
      { key: "university", label: "Facultăți & colegii" },
    ],
  },
  {
    key: "health",
    label: "Sănătate",
    countCap: 8,
    weight: 1,
    color: "#ef4444",
    subcategories: [
      { key: "pharmacy", label: "Farmacii" },
      { key: "clinic_doctors", label: "Clinici & cabinete" },
      { key: "hospital", label: "Spitale" },
      { key: "dentist", label: "Stomatologii" },
    ],
  },
  {
    key: "commercial",
    label: "Comercial & alimentar",
    countCap: 8,
    weight: 1,
    color: "#ec4899",
    subcategories: [
      { key: "convenience", label: "Magazine mixte" },
      { key: "supermarket", label: "Supermarketuri" },
    ],
  },
  {
    key: "culture",
    label: "Cultură",
    countCap: 5,
    weight: 1,
    color: "#0f4c5c",
    subcategories: [
      { key: "library", label: "Biblioteci" },
      { key: "museum", label: "Muzee" },
      { key: "theatre", label: "Teatre" },
      { key: "cinema", label: "Cinematografe" },
      { key: "arts_centre", label: "Centre culturale" },
    ],
  },
  {
    key: "transport",
    label: "Transport public",
    countCap: 12,
    weight: 1,
    color: "#f59e0b",
  },
  {
    key: "parks",
    label: "Parcuri & spații verzi",
    countCap: 5,
    weight: 1,
    color: "#22c55e",
  },
  {
    key: "sport",
    label: "Sport & fitness",
    countCap: 5,
    weight: 1,
    color: "#14b8a6",
    subcategories: [
      { key: "fitness_centre", label: "Săli fitness" },
      { key: "sports_centre", label: "Centre sportive" },
      { key: "pitch", label: "Terenuri sport" },
    ],
  },
];

const SUBCATEGORY_DEFAULT_NAMES: Record<WalkSubcategoryKey, string> = {
  kindergarten: "Grădiniță",
  school: "Școală",
  university: "Facultate / colegiu",
  pharmacy: "Farmacie",
  clinic_doctors: "Clinică / cabinet",
  hospital: "Spital",
  dentist: "Stomatologie",
  convenience: "Magazin alimentar",
  supermarket: "Supermarket",
  library: "Bibliotecă",
  museum: "Muzeu",
  theatre: "Teatru",
  cinema: "Cinema",
  arts_centre: "Centru cultural",
  fitness_centre: "Sală fitness",
  sports_centre: "Centru sportiv",
  pitch: "Teren sport",
};

export function subcategoryDefaultName(key: WalkSubcategoryKey): string {
  return SUBCATEGORY_DEFAULT_NAMES[key];
}

/** Max distance (m) to reuse a cached walk pin. */
export const WALK_CACHE_RADIUS_M = 50;

export const WALK_ISOCHRONE_MINUTES = 15;

export const OVERPASS_TIMEOUT_MS = 10_000;
