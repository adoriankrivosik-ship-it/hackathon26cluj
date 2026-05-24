import "server-only";

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

/** In-memory D1 shim for edge routes in local dev (walkscore cache, saved pins). */
export function createMockD1Database(): D1Database {
  const walkPins = buildMockWalkPins();
  const savedPins: {
    id: string;
    user_email: string;
    lng: number;
    lat: number;
    label: string | null;
    overall_score: number | null;
    scores_json: string | null;
    created_at: string;
  }[] = [];

  return {
    prepare(query: string) {
      const normalized = query.replace(/\s+/g, " ").trim().toLowerCase();

      return {
        bind: (...values: unknown[]) => ({
          all: async <T>() => {
            if (normalized.includes("from walk_pins")) {
              return { results: walkPins as T[], success: true as const };
            }
            if (
              normalized.includes("from saved_pins") &&
              normalized.includes("user_email")
            ) {
              const email = values[0] as string;
              const results = savedPins
                .filter((p) => p.user_email === email)
                .sort((a, b) => b.created_at.localeCompare(a.created_at));
              return { results: results as T[], success: true as const };
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
            if (normalized.includes("insert into saved_pins")) {
              savedPins.push({
                id: values[0] as string,
                user_email: values[1] as string,
                lng: values[2] as number,
                lat: values[3] as number,
                label: values[4] as string | null,
                overall_score: values[5] as number | null,
                scores_json: values[6] as string | null,
                created_at: values[7] as string,
              });
            }
            if (normalized.includes("delete from saved_pins")) {
              const id = values[0] as string;
              const email = values[1] as string;
              const idx = savedPins.findIndex(
                (p) => p.id === id && p.user_email === email,
              );
              if (idx >= 0) savedPins.splice(idx, 1);
              return {
                success: true as const,
                meta: { changes: idx >= 0 ? 1 : 0 },
              };
            }
            return { success: true as const, meta: { changes: 0 } };
          },
        }),
        all: async <T>() => {
          if (normalized.includes("from walk_pins")) {
            return { results: walkPins as T[], success: true as const };
          }
          return { results: [] as T[], success: true as const };
        },
        first: async <T>() => null as T | null,
        run: async () => ({ success: true as const, meta: { changes: 0 } }),
      };
    },
  } as unknown as D1Database;
}
