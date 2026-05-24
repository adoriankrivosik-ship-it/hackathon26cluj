import { NextResponse } from "next/server";
import { computeWalkScoreAt } from "@/lib/compute-walkscore";

export const dynamic = "force-dynamic";
export const runtime = "edge";

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
    const result = await computeWalkScoreAt(lng, lat);
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
