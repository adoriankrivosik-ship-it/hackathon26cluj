import type { UserRole } from "./admin-types";
import type { SessionUser } from "./auth-session";

export const PENDING_2FA_COOKIE_NAME = "totulcluj_2fa_pending";
export const PENDING_2FA_MAX_AGE = 120;

export interface Pending2FAPayload {
  tempToken: string;
  email: string;
  name: string;
  role: UserRole;
  id: string;
  exp: number;
}

function getAuthSecret(): string {
  return process.env.AUTH_SECRET ?? "dev-totulcluj-secret-change-me";
}

function encodeBase64Url(data: Uint8Array): string {
  const bin = String.fromCharCode(...data);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function signPayload(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return encodeBase64Url(new Uint8Array(sig));
}

async function verifySignature(
  payload: string,
  signature: string,
): Promise<boolean> {
  const expected = await signPayload(payload);
  return expected === signature;
}

export function generateTempToken(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createPending2faToken(
  data: Omit<Pending2FAPayload, "exp">,
): Promise<string> {
  const payload = JSON.stringify({
    ...data,
    exp: Date.now() + PENDING_2FA_MAX_AGE * 1000,
  });
  const encoded = encodeBase64Url(new TextEncoder().encode(payload));
  const sig = await signPayload(encoded);
  return `${encoded}.${sig}`;
}

export async function parsePending2faToken(
  token: string | undefined,
): Promise<Pending2FAPayload | null> {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const valid = await verifySignature(encoded, sig);
  if (!valid) return null;
  try {
    const json = new TextDecoder().decode(decodeBase64Url(encoded));
    const data = JSON.parse(json) as Pending2FAPayload;
    if (data.exp && Date.now() > data.exp) return null;
    if (!data.tempToken || !data.email || !data.role || !data.name || !data.id) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function pending2faFromUser(
  user: SessionUser,
  tempToken: string,
): Omit<Pending2FAPayload, "exp"> {
  return {
    tempToken,
    email: user.email,
    name: user.name,
    role: user.role,
    id: user.id,
  };
}

export function pending2faCookieOptions(value: string) {
  return {
    name: PENDING_2FA_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: PENDING_2FA_MAX_AGE,
  };
}

export function clearPending2faCookieOptions() {
  return {
    name: PENDING_2FA_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
