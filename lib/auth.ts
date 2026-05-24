import { cookies } from "next/headers";
import type { UserRole } from "./admin-types";
import {
  COOKIE_NAME,
  createSessionToken,
  isAdminRole,
  parseSessionToken,
  SESSION_COOKIE_MAX_AGE,
  type SessionUser,
} from "./auth-session";

export type { SessionUser };
export {
  COOKIE_NAME,
  createSessionToken,
  isAdminRole,
  parseSessionToken,
  ADMIN_ROLES,
} from "./auth-session";

interface AuthUserRecord {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

function getAuthUsers(): AuthUserRecord[] {
  const raw = process.env.AUTH_USERS;
  if (raw) {
    try {
      return JSON.parse(raw) as AuthUserRecord[];
    } catch {
      console.error("Invalid AUTH_USERS JSON");
    }
  }
  const password = process.env.AUTH_PASSWORD ?? "totulcluj2026";
  return [
    {
      id: "user-civil-1",
      email: "functionar@primarie.cluj",
      password,
      name: "Maria Ionescu",
      role: "civil_servant",
    },
    {
      id: "user-admin-1",
      email: "admin@totulcluj.ro",
      password,
      name: "Administrator",
      role: "admin",
    },
    {
      id: "user-citizen-1",
      email: "ion.popescu@gmail.com",
      password: "demo123",
      name: "Ion Popescu",
      role: "citizen",
    },
    {
      id: "user-citizen-2",
      email: "ana.muresan@gmail.com",
      password: "demo123",
      name: "Ana Mureșan",
      role: "citizen",
    },
  ];
}

export function getRedirectForRole(role: UserRole): string {
  if (role === "citizen") return "/harta";
  return "/admin/projects";
}

export function isCitizenRole(role: string): boolean {
  return role === "citizen";
}

export async function requireCitizenSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !isCitizenRole(session.role)) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function verifyCredentials(
  email: string,
  password: string,
): SessionUser | null {
  const user = getAuthUsers().find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return parseSessionToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export async function requireAdminSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
