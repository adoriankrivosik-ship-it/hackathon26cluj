import { NextResponse } from "next/server";
import { computeWalkScoreAt } from "@/lib/compute-walkscore";
import type { WalkCategoryKey } from "@/lib/walkscore-config";
import { computeOverallScoreWeighted } from "@/lib/walkscore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProfileWeightsInput = Partial<Record<WalkCategoryKey, number>>;

function applyProfileWeights(
  result: Awaited<ReturnType<typeof computeWalkScoreAt>>,
  profileWeights?: ProfileWeightsInput,
) {
  if (!profileWeights) return result;
  const overallScore = computeOverallScoreWeighted(
    result.scores,
    profileWeights,
  );
  return { ...result, overallScore };
}

async function handleWalkScore(
  lng: number,
  lat: number,
  profileWeights?: ProfileWeightsInput,
) {
  const result = await computeWalkScoreAt(lng, lat);
  return applyProfileWeights(result, profileWeights);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lng = Number(searchParams.get("lng"));
  const lat = Number(searchParams.get("lat"));

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return NextResponse.json(
      { error: "Parametrii lng și lat sunt obligatorii." },
      { status: 400 },
    );
  }

  try {
    const result = await handleWalkScore(lng, lat);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Nu s-a putut calcula scorul de mers pe jos.";

    const isOverpassBusy = message.includes("date deschise");

    return NextResponse.json(
      { error: message },
      { status: isOverpassBusy ? 503 : 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    lng?: number;
    lat?: number;
    profileWeights?: ProfileWeightsInput;
  };

  const lng = body.lng;
  const lat = body.lat;

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return NextResponse.json(
      { error: "Parametrii lng și lat sunt obligatorii." },
      { status: 400 },
    );
  }

  try {
    const result = await handleWalkScore(lng!, lat!, body.profileWeights);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Nu s-a putut calcula scorul de mers pe jos.";

    const isOverpassBusy = message.includes("date deschise");

    return NextResponse.json(
      { error: message },
      { status: isOverpassBusy ? 503 : 500 },
    );
  }
}
