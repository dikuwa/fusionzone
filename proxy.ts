/**
 * Proxy for FusionZone authentication and authorization.
 * Protects dashboard routes and handles redirects.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require authentication
const publicPaths = [
  "/",
  "/shop",
  "/cart",
  "/wishlist",
  "/checkout",
  "/order-success",
  "/services",
  "/promotions",
  "/contact",
  "/search",
  "/login",
  "/admin",
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
  "/admin/invite/accept",
  "/invite",
  "/auth/sign-in",
  "/auth/sign-up",
];

const apiAuthPrefix = "/api/auth";
const apiPublicPrefix = "/api/public";
const publicApiMethods: Record<string, string[]> = {
  "/api/orders": ["POST"],
  "/api/back-in-stock-requests": ["POST"],
  "/api/documents/token": ["GET"],
  "/api/products": ["GET"],
  "/api/catalog": ["GET"],
  "/api/settings": ["GET"],
  "/api/promotions": ["GET"],
};

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ===== DEV AUTH BYPASS =====
  // When no DATABASE_URL is configured, the app runs in mock/dev mode.
  // Skip all auth checks so developers can test the dashboard UI without
  // needing a real PostgreSQL database.
  const isDevMode = !process.env.DATABASE_URL;

  // Allow auth API routes
  if (pathname.startsWith(apiAuthPrefix)) return NextResponse.next();

  // Allow public API routes
  if (pathname.startsWith(apiPublicPrefix)) return NextResponse.next();
  if (publicApiMethods[pathname]?.includes(req.method)) return NextResponse.next();

  // Allow invitation API routes (needed for acceptance)
  if (pathname.startsWith("/api/invitations/validate")) return NextResponse.next();
  if (pathname.startsWith("/api/invitations/accept")) return NextResponse.next();
  if (pathname.startsWith("/api/invitations/")) return NextResponse.next();

  // Allow public document share routes
  if (pathname.startsWith("/api/documents/share/")) return NextResponse.next();
  if (pathname.startsWith("/d/")) return NextResponse.next();

  // Allow password reset API routes
  if (pathname.startsWith("/api/password-reset")) return NextResponse.next();

  // Redirect old auth paths to new login
  if (pathname === "/admin" || pathname === "/admin/login") {
    const signInUrl = new URL("/login", req.url);
    const redirectTo = req.nextUrl.searchParams.get("redirect");
    if (redirectTo?.startsWith("/dashboard")) {
      signInUrl.searchParams.set("redirect", redirectTo);
    }
    return NextResponse.redirect(signInUrl);
  }

  if (pathname === "/auth/sign-in" || pathname === "/auth/signin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/auth/sign-up" || pathname === "/auth/signup") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Allow public paths
  if (isPublicPath(pathname)) return NextResponse.next();

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/illustrations") ||
    pathname.startsWith("/fonts")
  ) {
    return NextResponse.next();
  }

  // In dev/mock mode, skip all session checks so dashboard and API work
  // without a database. The server-side auth-guard.ts will provide mock
  // sessions automatically.
  if (isDevMode) {
    return NextResponse.next();
  }

  // Check for session cookie (only in production/real mode)
  const sessionCookie =
    req.cookies.get("__Secure-better-auth.session_token") ??
    req.cookies.get("better-auth.session_token");

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/")) {
    if (!sessionCookie?.value) {
      // Redirect to login for dashboard routes
      if (pathname.startsWith("/dashboard")) {
        const signInUrl = new URL("/login", req.url);
        signInUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Return 401 for API routes
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
