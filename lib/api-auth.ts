import { NextResponse } from "next/server";
import { requireAdminSession } from "./auth";

export async function withAdminAuth<T>(
  handler: (session: Awaited<ReturnType<typeof requireAdminSession>>) => Promise<T>,
): Promise<T | NextResponse> {
  try {
    const session = await requireAdminSession();
    return handler(session);
  } catch {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }
}
