import { pointInPolygon } from "./geo";
import { projects, type PublicProject } from "./projects";

export interface NeighborhoodScores {
  education: number;
  parks: number;
  transport: number;
  healthcare: number;
  groceries: number;
}

export interface Neighborhood {
  id: string;
  name: string;
  center: [number, number];
  boundary: [number, number][];
  scores: NeighborhoodScores;
  overallScore: number;
  amenityCount: number;
}

function avgScore(scores: NeighborhoodScores): number {
  const { education, parks, transport, healthcare, groceries } = scores;
  return Math.round(
    (education + parks + transport + healthcare + groceries) / 5,
  );
}

function buildNeighborhood(
  id: string,
  name: string,
  center: [number, number],
  boundary: [number, number][],
  scores: NeighborhoodScores,
  amenityCount: number,
): Neighborhood {
  return {
    id,
    name,
    center,
    boundary,
    scores,
    overallScore: avgScore(scores),
    amenityCount,
  };
}

/** Seeded Cluj cartiere with rough boundaries and 15-minute city scores. */
export const neighborhoods: Neighborhood[] = [
  buildNeighborhood(
    "centru",
    "Centru",
    [23.589, 46.771],
    [
      [23.578, 46.766],
      [23.598, 46.766],
      [23.601, 46.771],
      [23.597, 46.775],
      [23.582, 46.775],
      [23.576, 46.771],
      [23.578, 46.768],
    ],
    {
      education: 94,
      parks: 90,
      transport: 92,
      healthcare: 88,
      groceries: 96,
    },
    118,
  ),
  buildNeighborhood(
    "marasti",
    "Mărăști",
    [23.622, 46.756],
    [
      [23.605, 46.748],
      [23.638, 46.748],
      [23.642, 46.758],
      [23.635, 46.766],
      [23.612, 46.764],
      [23.602, 46.754],
    ],
    {
      education: 58,
      parks: 52,
      transport: 64,
      healthcare: 54,
      groceries: 60,
    },
    47,
  ),
  buildNeighborhood(
    "manastur",
    "Mănăștur",
    [23.555, 46.762],
    [
      [23.532, 46.748],
      [23.572, 46.746],
      [23.578, 46.758],
      [23.574, 46.772],
      [23.558, 46.776],
      [23.538, 46.768],
      [23.534, 46.756],
    ],
    {
      education: 62,
      parks: 56,
      transport: 68,
      healthcare: 58,
      groceries: 55,
    },
    52,
  ),
  buildNeighborhood(
    "gheorgheni",
    "Gheorgheni",
    [23.615, 46.752],
    [
      [23.598, 46.742],
      [23.628, 46.742],
      [23.632, 46.752],
      [23.625, 46.762],
      [23.602, 46.760],
      [23.595, 46.748],
    ],
    {
      education: 76,
      parks: 74,
      transport: 70,
      healthcare: 72,
      groceries: 75,
    },
    71,
  ),
  buildNeighborhood(
    "grigorescu",
    "Grigorescu",
    [23.595, 46.782],
    [
      [23.578, 46.776],
      [23.608, 46.776],
      [23.612, 46.786],
      [23.602, 46.792],
      [23.582, 46.790],
      [23.576, 46.782],
    ],
    {
      education: 72,
      parks: 70,
      transport: 64,
      healthcare: 66,
      groceries: 73,
    },
    64,
  ),
  buildNeighborhood(
    "zorilor",
    "Zorilor",
    [23.585, 46.778],
    [
      [23.568, 46.772],
      [23.592, 46.772],
      [23.596, 46.782],
      [23.588, 46.788],
      [23.572, 46.786],
      [23.566, 46.778],
    ],
    {
      education: 80,
      parks: 78,
      transport: 74,
      healthcare: 76,
      groceries: 82,
    },
    79,
  ),
  buildNeighborhood(
    "iris",
    "Iris",
    [23.638, 46.782],
    [
      [23.618, 46.772],
      [23.652, 46.772],
      [23.658, 46.784],
      [23.648, 46.792],
      [23.622, 46.790],
      [23.614, 46.778],
    ],
    {
      education: 44,
      parks: 38,
      transport: 46,
      healthcare: 42,
      groceries: 45,
    },
    31,
  ),
];

export const SCORE_LABELS: {
  key: keyof NeighborhoodScores;
  label: string;
}[] = [
  { key: "education", label: "Educație" },
  { key: "parks", label: "Parcuri & spații verzi" },
  { key: "transport", label: "Transport public" },
  { key: "healthcare", label: "Sănătate" },
  { key: "groceries", label: "Alimente & magazine" },
];

/** Projects whose coordinates fall inside the neighborhood polygon. */
export function getProjectsInNeighborhood(
  neighborhood: Neighborhood,
): PublicProject[] {
  return projects.filter((p) =>
    pointInPolygon(p.coordinates, neighborhood.boundary),
  );
}

export function findNeighborhoodById(id: string): Neighborhood | undefined {
  return neighborhoods.find((n) => n.id === id);
}
