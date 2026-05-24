import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSessionToken,
  getRedirectForRole,
  isCitizenRole,
  sessionCookieOptions,
  verifyCredentials,
} from "@/lib/auth";
import {
  createPending2faToken,
  generateTempToken,
  pending2faCookieOptions,
  pending2faFromUser,
} from "@/lib/auth-2fa";

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

  const redirect = getRedirectForRole(user.role);

  if (isCitizenRole(user.role)) {
    const token = await createSessionToken(user);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieOptions(token));
    return NextResponse.json({ redirect });
  }

  const tempToken = generateTempToken();
  const pendingToken = await createPending2faToken(
    pending2faFromUser(user, tempToken),
  );
  const cookieStore = await cookies();
  cookieStore.set(pending2faCookieOptions(pendingToken));

  return NextResponse.json({ step: "2fa", tempToken, redirect });
}
