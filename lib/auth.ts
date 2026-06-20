/**
 * Better Auth configuration for FusionZone.
 * Invite-only authentication with role-based access control.
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { twoFactor } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { UserRole, UserStatus } from "@/lib/enums";
import { sendPasswordResetEmail } from "@/lib/email";
import { PASSWORD_REUSE_ERROR } from "@/lib/password-policy";

const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : vercelUrl) || "http://localhost:3000";
const trustedOrigins = Array.from(new Set([
  baseURL,
  process.env.NEXT_PUBLIC_APP_URL,
  vercelUrl,
  "http://localhost:3000",
  "http://localhost:3040",
].filter((origin): origin is string => Boolean(origin))));

/**
 * Returns true when no real database is configured (mock/dev mode).
 */
export function isAuthMockMode(): boolean {
  return !process.env.DATABASE_URL;
}

/**
 * Better Auth configuration with Prisma adapter.
 * Features:
 * - Email/password authentication
 * - Password reset
 * - Two-factor authentication (TOTP)
 * - Session management
 * - Disabled public sign-up
 */
export const auth = betterAuth({
  baseURL,
  trustedOrigins,

  // Database adapter
  database: db ? prismaAdapter(db, { provider: "postgresql" }) : undefined,

  // Email and password configuration
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, token }) => {
      await sendPasswordResetEmail({ to: user.email, token });
    },
    password: {
      hash: (password) => bcrypt.hash(password, 12),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },

  // Email verification configuration
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      console.log(`[Auth] Verification email for ${user.email}: ${url}`);
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24, // 1 day
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    ipAddress: {
      disableIpTracking: false,
    },
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },

  plugins: [
    twoFactor({
      issuer: "FusionZone",
      backupCodeOptions: { amount: 10 },
    }),
  ],

  // Custom fields to include in session/user objects
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.STAFF,
        input: false,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE,
        input: false,
      },
      permissions: {
        type: "json",
        required: false,
        input: false,
      },
      twoFactorEnabled: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false,
      },
      mustChangePassword: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false,
      },
      invitedById: {
        type: "string",
        required: false,
        input: false,
      },
      profileEmail: {
        type: "string",
        required: false,
        input: false,
      },
      jobTitle: {
        type: "string",
        required: false,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/change-password"
        && ctx.body?.currentPassword
        && ctx.body?.newPassword
        && ctx.body.currentPassword === ctx.body.newPassword
      ) {
        throw new APIError("BAD_REQUEST", { message: PASSWORD_REUSE_ERROR });
      }

      if (ctx.path !== "/sign-in/email" || !db || !ctx.body?.email) return;

      const email = String(ctx.body.email).toLowerCase().trim();
      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, status: true, role: true, twoFactorEnabled: true, mustChangePassword: true, permissions: true },
      });

      if (!user) return;

      // Account status check
      if (user.status !== UserStatus.ACTIVE) {
        throw new APIError("FORBIDDEN", {
          message: "This account is not active. Contact an administrator.",
        });
      }

      // Note: mustChangePassword is handled by the dashboard layout redirect.
      // Users with temporary passwords can sign in but are redirected to the
      // settings page to set a new password before accessing the dashboard.

      // Auto-disable 2FA if the user never completed setup (has twoFactorEnabled
      // set but no TwoFactor record with an actual secret). This prevents users
      // from being locked out when 2FA was toggled but never configured.
      if (user.twoFactorEnabled) {
        const twoFactorRecord = await db.twoFactor.findUnique({
          where: { userId: user.id },
          select: { secret: true },
        });
        if (!twoFactorRecord || !twoFactorRecord.secret) {
          await db.user.update({
            where: { id: user.id },
            data: { twoFactorEnabled: false },
          });
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email" || !db) return;
      const userId = ctx.context.newSession?.user.id;
      if (userId) {
        try {
          const user = await db.user.update({
            where: { id: userId },
            data: { lastActiveAt: new Date() },
            select: { email: true, role: true },
          });
          await db.auditLog.create({
            data: {
              actorId: userId,
              actorEmail: user.email,
              actorRole: user.role,
              action: "Signed in",
              targetType: "authentication",
              targetId: userId,
              targetLabel: user.email,
            },
          });
        } catch (error) {
          console.error("[Auth] Could not record successful sign-in:", error);
        }
      }
    }),
  },
});

// Export types
export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session;
