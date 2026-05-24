import { NextResponse } from "next/server";
import { loadProjects } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/projects — optional JSON access to seeded D1 data. */
export async function GET() {
  try {
    const projects = await loadProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects failed:", error);
    return NextResponse.json(
      { error: "Failed to load projects from D1" },
      { status: 500 },
    );
  }
}
