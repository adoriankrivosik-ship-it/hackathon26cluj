import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSessionToken,
  sessionCookieOptions,
  verifyCredentials,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Completați emailul și parola." },
      { status: 400 },
    );
  }

  const user = verifyCredentials(email, password);
  if (!user) {
    return NextResponse.json(
      { error: "Email sau parolă incorectă." },
      { status: 401 },
    );
  }

  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieOptions(token));

  return NextResponse.json({ ok: true, user: { name: user.name, role: user.role } });
}
