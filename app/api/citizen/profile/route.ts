import { NextResponse } from "next/server";
import { generateCitizenProfileDetailed } from "@/lib/ai";
import { requireCitizenSession } from "@/lib/auth";
import type { CitizenAnswers } from "@/lib/citizen-profile-types";
import {
  deleteCitizenProfile,
  getCitizenProfileByEmail,
  parseCitizenAnswersJson,
  parseCitizenProfileJson,
  upsertCitizenProfile,
} from "@/lib/citizen-profiles";

export const runtime = "nodejs";
export const maxDuration = 120;

function unauthorized() {
  return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
}

export async function GET() {
  try {
    const session = await requireCitizenSession();
    const row = await getCitizenProfileByEmail(session.email);
    if (!row) {
      return NextResponse.json({ profile: null, answers: null });
    }

    return NextResponse.json({
      profile: parseCitizenProfileJson(row.profile_json),
      answers: parseCitizenAnswersJson(row.answers_json),
      updated_at: row.updated_at,
    });
  } catch {
    return unauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireCitizenSession();
    const body = (await request.json()) as CitizenAnswers;

    if (!body || !Array.isArray(body.lifestyle) || !Array.isArray(body.priorities)) {
      return NextResponse.json(
        { error: "Răspunsurile profilului sunt invalide." },
        { status: 400 },
      );
    }

    const generation = await generateCitizenProfileDetailed(body);
    await upsertCitizenProfile({
      userEmail: session.email,
      answers: body,
      profile: generation.profile,
    });

    return NextResponse.json({
      profile: generation.profile,
      answers: body,
      source: generation.source,
      warnings: generation.warnings,
      aiConfigured: generation.aiConfigured,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return unauthorized();
    }
    console.error("citizen/profile POST:", e);
    return NextResponse.json(
      { error: "Nu s-a putut genera profilul." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await requireCitizenSession();
    await deleteCitizenProfile(session.email);
    return NextResponse.json({ ok: true });
  } catch {
    return unauthorized();
  }
}
