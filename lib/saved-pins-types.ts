import type { WalkScoreScores } from "./walkscore-types";

export interface DbSavedPin {
  id: string;
  user_email: string;
  lng: number;
  lat: number;
  label: string | null;
  overall_score: number | null;
  scores_json: string | null;
  profile_name: string | null;
  profile_emoji: string | null;
  created_at: string;
}

export function parseSavedPinScores(
  scoresJson: string | null,
): WalkScoreScores | null {
  if (!scoresJson) return null;
  try {
    return JSON.parse(scoresJson) as WalkScoreScores;
  } catch {
    return null;
  }
}
