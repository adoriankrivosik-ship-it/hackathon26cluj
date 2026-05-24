import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSessionToken,
  getRedirectForRole,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  clearPending2faCookieOptions,
  parsePending2faToken,
  PENDING_2FA_COOKIE_NAME,
} from "@/lib/auth-2fa";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string };
  const code = body.code ?? "";

  const cookieStore = await cookies();
  const pendingRaw = cookieStore.get(PENDING_2FA_COOKIE_NAME)?.value;
  const pending = await parsePending2faToken(pendingRaw);

  if (!pending) {
    return NextResponse.json(
      { error: "Sesiunea a expirat. Autentifică-te din nou." },
      { status: 401 },
    );
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "Cod incorect. Încearcă din nou." },
      { status: 400 },
    );
  }

  const token = await createSessionToken({
    id: pending.id,
    name: pending.name,
    email: pending.email,
    role: pending.role,
  });

  cookieStore.set(clearPending2faCookieOptions());
  cookieStore.set(sessionCookieOptions(token));

  return NextResponse.json({
    success: true,
    redirect: getRedirectForRole(pending.role),
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(clearPending2faCookieOptions());
  return NextResponse.json({ ok: true });
}
