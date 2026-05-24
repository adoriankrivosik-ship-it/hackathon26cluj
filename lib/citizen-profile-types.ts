import { WALK_CATEGORIES, type WalkCategoryKey } from "./walkscore-config";
import type { WalkScoreScores } from "./walkscore-types";

export interface CitizenAnswers {
  lifestyle: string[];
  transport: string;
  priorities: string[];
  family: string[];
  freetext: string;
  extra_chips: string[];
}

export interface CitizenProfileWeights {
  education: number;
  health: number;
  parks: number;
  transport: number;
  commercial: number;
  culture: number;
  sport: number;
  restaurants: number;
  banks: number;
}

export interface CitizenProfile {
  weights: CitizenProfileWeights;
  excluded_categories: string[];
  profile_name: string;
  profile_emoji: string;
  profile_summary: string;
}

export interface CitizenProfileRecord {
  profile: CitizenProfile;
  answers: CitizenAnswers;
  updated_at: string;
}

export type CitizenProfileSource = "ai" | "heuristic" | "default";

export interface CitizenProfileGenerationResult {
  profile: CitizenProfile;
  source: CitizenProfileSource;
  warnings: string[];
  aiConfigured: boolean;
}

export const PROFILE_STORAGE_KEY = "totulcluj_citizen_profile";
export const PROFILE_ANSWERS_STORAGE_KEY = "totulcluj_citizen_answers";

export const LIFESTYLE_OPTIONS = [
  { label: "Activ și în mișcare", emoji: "🏃" },
  { label: "Liniștit, acasă sau în natură", emoji: "📚" },
  { label: "Social, ieșiri și restaurante", emoji: "🍕" },
  { label: "Familie și copii", emoji: "👨‍👩‍👧" },
  { label: "Lucrez de acasă", emoji: "💻" },
] as const;

export const TRANSPORT_OPTIONS = [
  { label: "Pe jos", emoji: "🚶" },
  { label: "Bicicletă", emoji: "🚲" },
  { label: "Transport public", emoji: "🚌" },
  { label: "Mașină", emoji: "🚗" },
] as const;

export const PRIORITY_OPTIONS = [
  { key: "education", label: "Școli și educație", emoji: "🏫" },
  { key: "health", label: "Sănătate și farmacii", emoji: "🏥" },
  { key: "parks", label: "Parcuri și natură", emoji: "🌳" },
  { key: "commercial", label: "Magazine și servicii", emoji: "🛒" },
  { key: "culture", label: "Viață culturală", emoji: "🎭" },
  { key: "sport", label: "Sport și fitness", emoji: "⚽" },
  { key: "transport", label: "Transport public", emoji: "🚌" },
  { key: "restaurants", label: "Restaurante și cafenele", emoji: "🍽️" },
] as const;

export const FAMILY_OPTIONS = [
  { label: "Singur/ă", emoji: "👤" },
  { label: "Cu partenerul/a", emoji: "💑" },
  { label: "Cu copii mici (0-6 ani)", emoji: "👶" },
  { label: "Cu copii școlari (7-18 ani)", emoji: "🎒" },
  { label: "Cu părinți sau bunici", emoji: "👴" },
] as const;

export const EXTRA_CHIP_SUGGESTIONS = [
  "Aproape de un parc mare",
  "Zonă liniștită",
  "Viață de noapte activă",
  "Grădiniță publică",
  "Fără mașină",
  "Aproape de centru",
] as const;

const WEIGHT_LABELS: Record<keyof CitizenProfileWeights, string> = {
  education: "Educație",
  health: "Sănătate",
  parks: "Parcuri",
  transport: "Transport",
  commercial: "Magazine",
  culture: "Cultură",
  sport: "Sport",
  restaurants: "Restaurante",
  banks: "Bănci",
};

export function getWeightLabel(key: keyof CitizenProfileWeights): string {
  return WEIGHT_LABELS[key];
}

export function profileWeightsToWalkWeights(
  weights: CitizenProfileWeights,
): Record<WalkCategoryKey, number> {
  return {
    education: weights.education,
    health: weights.health,
    parks: weights.parks,
    transport: weights.transport,
    commercial: weights.commercial,
    culture: weights.culture,
    sport: weights.sport,
    food: weights.restaurants,
    banking: weights.banks,
  };
}

/** Client-safe weighted overall score from category sub-scores. */
export function computeWeightedOverallScore(
  scores: WalkScoreScores,
  weights: Record<WalkCategoryKey, number>,
): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const cat of WALK_CATEGORIES) {
    const w = weights[cat.key] ?? 0;
    if (w <= 0) continue;
    weightedSum += scores[cat.key] * w;
    weightTotal += w;
  }
  if (weightTotal <= 0) {
    const sum = WALK_CATEGORIES.reduce((acc, c) => acc + scores[c.key], 0);
    return Math.round(sum / WALK_CATEGORIES.length);
  }
  return Math.round(weightedSum / weightTotal);
}

export function createEmptyAnswers(): CitizenAnswers {
  return {
    lifestyle: [],
    transport: "",
    priorities: [],
    family: [],
    freetext: "",
    extra_chips: [],
  };
}

export function readProfileFromSessionStorage(): CitizenProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CitizenProfile;
  } catch {
    return null;
  }
}

export function writeProfileToSessionStorage(profile: CitizenProfile | null): void {
  if (typeof window === "undefined") return;
  if (profile) {
    sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } else {
    sessionStorage.removeItem(PROFILE_STORAGE_KEY);
  }
}

export function readAnswersFromSessionStorage(): CitizenAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PROFILE_ANSWERS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CitizenAnswers;
  } catch {
    return null;
  }
}

export function writeAnswersToSessionStorage(answers: CitizenAnswers | null): void {
  if (typeof window === "undefined") return;
  if (answers) {
    sessionStorage.setItem(PROFILE_ANSWERS_STORAGE_KEY, JSON.stringify(answers));
  } else {
    sessionStorage.removeItem(PROFILE_ANSWERS_STORAGE_KEY);
  }
}
