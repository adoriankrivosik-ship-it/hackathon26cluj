import { NextResponse } from "next/server";
import { requireCitizenSession } from "@/lib/auth";
import { listSavedPinsForUser } from "@/lib/saved-pins";

export const runtime = "edge";

export async function GET() {
  try {
    const session = await requireCitizenSession();
    const pins = await listSavedPinsForUser(session.email);
    return NextResponse.json({ pins });
  } catch {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }
}
