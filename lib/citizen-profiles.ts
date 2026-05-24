import "server-only";

import type { CitizenAnswers, CitizenProfile } from "./citizen-profile-types";
import { getDatabase } from "./get-database-edge";

export interface DbCitizenProfile {
  id: string;
  user_email: string;
  answers_json: string;
  profile_json: string;
  created_at: string;
  updated_at: string;
}

export function generateCitizenProfileId(): string {
  return `cprof_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function parseCitizenProfileJson(json: string): CitizenProfile {
  return JSON.parse(json) as CitizenProfile;
}

export function parseCitizenAnswersJson(json: string): CitizenAnswers {
  return JSON.parse(json) as CitizenAnswers;
}

export async function getCitizenProfileByEmail(
  userEmail: string,
): Promise<DbCitizenProfile | null> {
  const db = await getDatabase();
  return db
    .prepare("SELECT * FROM citizen_profiles WHERE user_email = ?")
    .bind(userEmail)
    .first<DbCitizenProfile>();
}

export async function upsertCitizenProfile(input: {
  userEmail: string;
  answers: CitizenAnswers;
  profile: CitizenProfile;
}): Promise<DbCitizenProfile> {
  const db = await getDatabase();
  const existing = await getCitizenProfileByEmail(input.userEmail);
  const now = new Date().toISOString();
  const answersJson = JSON.stringify(input.answers);
  const profileJson = JSON.stringify(input.profile);

  if (existing) {
    await db
      .prepare(
        `UPDATE citizen_profiles
         SET answers_json = ?, profile_json = ?, updated_at = ?
         WHERE user_email = ?`,
      )
      .bind(answersJson, profileJson, now, input.userEmail)
      .run();

    return {
      ...existing,
      answers_json: answersJson,
      profile_json: profileJson,
      updated_at: now,
    };
  }

  const id = generateCitizenProfileId();
  await db
    .prepare(
      `INSERT INTO citizen_profiles (id, user_email, answers_json, profile_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, input.userEmail, answersJson, profileJson, now, now)
    .run();

  return {
    id,
    user_email: input.userEmail,
    answers_json: answersJson,
    profile_json: profileJson,
    created_at: now,
    updated_at: now,
  };
}

export async function deleteCitizenProfile(userEmail: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db
    .prepare("DELETE FROM citizen_profiles WHERE user_email = ?")
    .bind(userEmail)
    .run();
  return (result.meta.changes ?? 0) > 0;
}
