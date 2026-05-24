import "server-only";

import { getDatabase } from "./get-database-edge";
import { distanceMeters } from "./pin-distance";
import type { WalkScoreScores } from "./walkscore-types";
import type { DbSavedPin } from "./saved-pins-types";

export type { DbSavedPin } from "./saved-pins-types";

export function generateSavedPinId(): string {
  return `pin_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export async function listSavedPinsForUser(
  userEmail: string,
): Promise<DbSavedPin[]> {
  const db = await getDatabase();
  const { results } = await db
    .prepare(
      "SELECT * FROM saved_pins WHERE user_email = ? ORDER BY created_at DESC",
    )
    .bind(userEmail)
    .all<DbSavedPin>();
  return results ?? [];
}

export async function findSavedPinNear(
  userEmail: string,
  lng: number,
  lat: number,
  radiusM = 50,
): Promise<DbSavedPin | null> {
  const pins = await listSavedPinsForUser(userEmail);
  for (const pin of pins) {
    if (distanceMeters(lng, lat, pin.lng, pin.lat) <= radiusM) {
      return pin;
    }
  }
  return null;
}

export async function createSavedPin(input: {
  userEmail: string;
  lng: number;
  lat: number;
  overallScore: number;
  scoresJson: WalkScoreScores;
  label?: string | null;
  profileName?: string | null;
  profileEmoji?: string | null;
}): Promise<DbSavedPin> {
  const db = await getDatabase();
  const id = generateSavedPinId();
  const now = new Date().toISOString();
  const scoresJson = JSON.stringify(input.scoresJson);

  await db
    .prepare(
      `INSERT INTO saved_pins (id, user_email, lng, lat, label, overall_score, scores_json, profile_name, profile_emoji, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.userEmail,
      input.lng,
      input.lat,
      input.label ?? null,
      input.overallScore,
      scoresJson,
      input.profileName ?? null,
      input.profileEmoji ?? null,
      now,
    )
    .run();

  return {
    id,
    user_email: input.userEmail,
    lng: input.lng,
    lat: input.lat,
    label: input.label ?? null,
    overall_score: input.overallScore,
    scores_json: scoresJson,
    profile_name: input.profileName ?? null,
    profile_emoji: input.profileEmoji ?? null,
    created_at: now,
  };
}

export async function deleteSavedPin(
  id: string,
  userEmail: string,
): Promise<boolean> {
  const db = await getDatabase();
  const result = await db
    .prepare("DELETE FROM saved_pins WHERE id = ? AND user_email = ?")
    .bind(id, userEmail)
    .run();
  return (result.meta.changes ?? 0) > 0;
}