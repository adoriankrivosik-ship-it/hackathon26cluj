import type { UserRole } from "./admin-types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

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

export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload = JSON.stringify({
    ...user,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  });
  const encoded = encodeBase64Url(new TextEncoder().encode(payload));
  const sig = await signPayload(encoded);
  return `${encoded}.${sig}`;
}

export async function parseSessionToken(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const valid = await verifySignature(encoded, sig);
  if (!valid) return null;
  try {
    const json = new TextDecoder().decode(decodeBase64Url(encoded));
    const data = JSON.parse(json) as SessionUser & { exp?: number };
    if (data.exp && Date.now() > data.exp) return null;
    if (!data.id || !data.role || !data.name) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
    };
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "totulcluj_session";
export const SESSION_COOKIE_MAX_AGE = SESSION_MAX_AGE;

export const ADMIN_ROLES: UserRole[] = ["civil_servant", "admin"];

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}
