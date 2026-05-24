import type {
  CitizenAnswers,
  CitizenProfile,
  CitizenProfileWeights,
} from "./citizen-profile-types";
import { getWeightLabel } from "./citizen-profile-types";

const WEIGHT_KEYS: (keyof CitizenProfileWeights)[] = [
  "education",
  "health",
  "parks",
  "transport",
  "commercial",
  "culture",
  "sport",
  "restaurants",
  "banks",
];

const RANK_WEIGHTS = [0.2, 0.16, 0.13, 0.11, 0.09, 0.07, 0.05] as const;

const PROFILE_BY_TOP: Record<
  keyof CitizenProfileWeights,
  { name: string; emoji: string }
> = {
  education: { name: "Focus pe educație", emoji: "🏫" },
  health: { name: "Sănătate pe primul loc", emoji: "🏥" },
  parks: { name: "Verde și aer liber", emoji: "🌳" },
  transport: { name: "Conectat la transport", emoji: "🚌" },
  commercial: { name: "Totul la îndemână", emoji: "🛒" },
  culture: { name: "Viață culturală", emoji: "🎭" },
  sport: { name: "Activ și energic", emoji: "⚽" },
  restaurants: { name: "Social și gustos", emoji: "🍽️" },
  banks: { name: "Practic și organizat", emoji: "🏦" },
};

function isWeightKey(key: string): key is keyof CitizenProfileWeights {
  return WEIGHT_KEYS.includes(key as keyof CitizenProfileWeights);
}

function createEqualWeights(): CitizenProfileWeights {
  const equal = 1 / WEIGHT_KEYS.length;
  return {
    education: equal,
    health: equal,
    parks: equal,
    transport: equal,
    commercial: equal,
    culture: equal,
    sport: equal,
    restaurants: equal,
    banks: equal,
  };
}

function createBaseWeights(): CitizenProfileWeights {
  return {
    education: 0.02,
    health: 0.02,
    parks: 0.02,
    transport: 0.02,
    commercial: 0.02,
    culture: 0.02,
    sport: 0.02,
    restaurants: 0.02,
    banks: 0.02,
  };
}

function normalizeWeights(raw: CitizenProfileWeights): CitizenProfileWeights {
  let sum = WEIGHT_KEYS.reduce((acc, k) => acc + raw[k], 0);
  if (sum <= 0) {
    return createEqualWeights();
  }
  const out = {} as CitizenProfileWeights;
  for (const k of WEIGHT_KEYS) {
    out[k] = raw[k] / sum;
  }
  return out;
}

function applyTextBoosts(
  weights: CitizenProfileWeights,
  text: string,
): void {
  const t = text.toLowerCase();
  if (/parc|natur|verde/.test(t)) weights.parks += 0.08;
  if (/lini[sș]t/.test(t)) weights.parks += 0.04;
  if (/noapte|ie[sș]ir|social/.test(t)) {
    weights.restaurants += 0.07;
    weights.culture += 0.05;
  }
  if (/gr[aă]dini[tț]/.test(t)) weights.education += 0.08;
  if (/f[aă]r[aă].*ma[sș]in/.test(t)) weights.transport += 0.1;
  if (/centru/.test(t)) {
    weights.commercial += 0.06;
    weights.restaurants += 0.05;
  }
  if (/universit|facultat|scoal/.test(t)) weights.education += 0.1;
  if (/spital|clinic|s[aă]n[aă]t/.test(t)) weights.health += 0.08;
  if (/sport|fitness/.test(t)) weights.sport += 0.08;
}

/** Rule-based profile when OpenRouter is unavailable or returns unusable JSON. */
export function buildHeuristicCitizenProfile(
  answers: CitizenAnswers,
): CitizenProfile {
  const weights = createBaseWeights();

  const ranked = answers.priorities.filter(isWeightKey);
  const excluded = ranked.length >= 2 ? ranked.slice(-2) : [];
  const active = ranked.length >= 3 ? ranked.slice(0, -2) : ranked;

  for (const key of excluded) {
    weights[key] = 0;
  }

  active.forEach((key, index) => {
    weights[key] = RANK_WEIGHTS[index] ?? 0.06;
  });

  for (const label of answers.lifestyle) {
    if (label.includes("Activ")) {
      weights.sport += 0.08;
      weights.parks += 0.05;
    }
    if (label.includes("Familie")) {
      weights.education += 0.08;
      weights.parks += 0.05;
      weights.health += 0.05;
    }
    if (label.includes("Social")) {
      weights.restaurants += 0.1;
      weights.culture += 0.06;
    }
    if (label.includes("Liniștit") || label.includes("natură")) {
      weights.parks += 0.1;
    }
    if (label.includes("acasă")) {
      weights.commercial += 0.05;
      weights.restaurants += 0.04;
    }
  }

  if (answers.transport === "Pe jos") {
    weights.parks += 0.06;
    weights.commercial += 0.04;
  } else if (answers.transport === "Bicicletă") {
    weights.parks += 0.05;
    weights.sport += 0.04;
  } else if (answers.transport === "Transport public") {
    weights.transport += 0.12;
  }

  for (const label of answers.family) {
    if (label.includes("copii mici")) {
      weights.education += 0.07;
      weights.health += 0.05;
      weights.parks += 0.04;
    }
    if (label.includes("școlari")) {
      weights.education += 0.09;
    }
    if (label.includes("bunici")) {
      weights.health += 0.06;
    }
  }

  applyTextBoosts(weights, answers.extra_chips.join(" "));
  applyTextBoosts(weights, answers.freetext);

  for (const key of excluded) {
    weights[key] = 0;
  }

  const normalized = normalizeWeights(weights);

  const top = WEIGHT_KEYS.map((k) => ({ k, v: normalized[k] }))
    .sort((a, b) => b.v - a.v)[0];
  const branding = top ? PROFILE_BY_TOP[top.k] : PROFILE_BY_TOP.parks;

  const priorityLabels = active
    .slice(0, 3)
    .map((k) => getWeightLabel(k))
    .join(", ");

  return {
    weights: normalized,
    excluded_categories: excluded.map((k) => getWeightLabel(k)),
    profile_name: branding.name,
    profile_emoji: branding.emoji,
    profile_summary: priorityLabels
      ? `Profil calculat din răspunsurile tale, cu accent pe ${priorityLabels}.`
      : "Profil calculat local din preferințele tale.",
  };
}

export function isNearlyEqualProfile(profile: CitizenProfile): boolean {
  const target = 1 / WEIGHT_KEYS.length;
  return WEIGHT_KEYS.every(
    (k) => Math.abs(profile.weights[k] - target) < 0.015,
  );
}
