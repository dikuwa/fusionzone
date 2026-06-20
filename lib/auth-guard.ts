/**
 * Auth guard helpers for protecting dashboard routes and API endpoints.
 *
 * In real mode (DATABASE_URL set): validates Better Auth sessions.
 * In mock mode (no database): returns a mock admin session so the app still works.
 */
import { NextResponse } from "next/server";
import { auth, isAuthMockMode } from "@/lib/auth";
import { headers } from "next/headers";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type Session = {
  user: SessionUser;
} | null;

/**
 * Get the current session — works in both real and mock modes.
 * Use in server components and API routes.
 */
export async function getSession(): Promise<Session> {
  if (isAuthMockMode()) {
    return {
      user: {
        id: "admin-1",
        name: "Admin User",
        email: "admin@fusionzone.example",
        role: "Admin",
      },
    };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return null;

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        // role is a custom field on the User model; Better Auth types
        // don't include it by default so we cast via the raw data
        role: (session.user as Record<string, unknown>).role as string || "Staff",
      },
    };
  } catch {
    return null;
  }
}

/**
 * Require a valid session — returns the session or an error response.
 * For use in API routes.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return {
      session: null as Session,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null as NextResponse | null };
}

/**
 * Require a specific role — returns the session or an error response.
 * For use in API routes.
 */
export async function requireRole(role: string | string[]) {
  const { session, error } = await requireSession();
  if (error) return { session, error };

  const roles = Array.isArray(role) ? role : [role];
  if (!session || !roles.includes(session.user.role)) {
    return {
      session,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null as NextResponse | null };
}
