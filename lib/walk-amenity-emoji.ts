import type { WalkCategoryKey } from "./walkscore-config";

/** Phone-style emoji per walkability category (map markers + popups). */
export const WALK_CATEGORY_EMOJI: Record<WalkCategoryKey, string> = {
  education: "🎓",
  health: "🏥",
  commercial: "🛒",
  culture: "🎭",
  transport: "🚌",
  parks: "🌳",
  sport: "⚽",
  banking: "🏦",
  food: "🍽️",
};

export function categoryEmoji(category: WalkCategoryKey): string {
  return WALK_CATEGORY_EMOJI[category];
}
