import { NextResponse } from "next/server";
import { requireCitizenSession } from "@/lib/auth";
import {
  createSavedPin,
  deleteSavedPin,
  findSavedPinNear,
  listSavedPinsForUser,
} from "@/lib/saved-pins";
import type { WalkScoreScores } from "@/lib/walkscore-types";

export const runtime = "edge";

async function unauthorized() {
  return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
}

export async function POST(request: Request) {
  try {
    const session = await requireCitizenSession();
    const body = (await request.json()) as {
      lng?: number;
      lat?: number;
      overall_score?: number;
      scores_json?: WalkScoreScores;
      label?: string;
    };

    const lng = body.lng;
    const lat = body.lat;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return NextResponse.json(
        { error: "Coordonatele sunt obligatorii." },
        { status: 400 },
      );
    }

    const existing = await findSavedPinNear(session.email, lng!, lat!);
    if (existing) {
      return NextResponse.json({ pin: existing, alreadySaved: true });
    }

    const pin = await createSavedPin({
      userEmail: session.email,
      lng: lng!,
      lat: lat!,
      overallScore: body.overall_score ?? 0,
      scoresJson: body.scores_json ?? ({} as WalkScoreScores),
      label: body.label,
    });

    return NextResponse.json({ pin });
  } catch {
    return unauthorized();
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireCitizenSession();
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "ID lipsă." }, { status: 400 });
    }

    const removed = await deleteSavedPin(body.id, session.email);
    if (!removed) {
      return NextResponse.json({ error: "Pin negăsit." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return unauthorized();
  }
}
