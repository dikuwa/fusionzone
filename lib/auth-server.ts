/**
 * Server-side authentication utilities.
 * These functions are safe to use in server components and API routes.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserRole, UserStatus, InvitationStatus, normalizeUserRole, normalizeUserStatus } from "@/lib/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Permission } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import { PASSWORD_REUSE_ERROR, passwordMatchesHash } from "@/lib/password-policy";

// ============== SESSION MANAGEMENT ==============

/**
 * Get the current authenticated user from session.
 * Cached for the duration of the request.
 */
export const getCurrentUser = cache(async () => {
  if (!db) return null;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return null;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;
  const status = normalizeUserStatus(user.status);

  // Check if user account is active
  // Only ACTIVE users can access the dashboard
  if (status !== UserStatus.ACTIVE) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeUserRole(user.role),
    status,
    permissions: (user.permissions as Permission[] | undefined) ?? [],
    twoFactorEnabled: user.twoFactorEnabled,
    mustChangePassword: user.mustChangePassword,
    emailVerified: user.emailVerified,
    image: user.image,
    jobTitle: user.jobTitle,
    phone: user.phone,
    lastActiveAt: user.lastActiveAt,
    passwordChangedAt: user.passwordChangedAt,
    invitedById: user.invitedById,
  };
});

/**
 * Check if the current user has a specific permission.
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return hasPermission(user.role, user.permissions, permission);
}

/**
 * Require authentication - throws if not authenticated.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Require a specific permission - throws if not authorized.
 */
export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  if (!hasPermission(user.role, user.permissions, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
  return user;
}

export async function authorizePermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }
  if (!hasPermission(user.role, user.permissions, permission)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Permission denied" }, { status: 403 }),
    };
  }
  return { user, error: null };
}

/**
 * Require a specific role - throws if not authorized.
 * OWNER passes all role checks.
 */
export async function requireRole(role: UserRole | UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  // OWNER can access anything
  if (user.role === UserRole.OWNER) {
    return user;
  }

  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    throw new Error(`Role required: ${roles.join(" or ")}`);
  }

  return user;
}

/**
 * Check if user can manage another user.
 * Prevents non-OWNER users from managing OWNER accounts.
 */
export async function canManageUser(targetUserId: string): Promise<boolean> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  // OWNER can manage anyone
  if (currentUser.role === UserRole.OWNER) return true;

  if (!db) return false;

  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { role: true },
  });

  if (!targetUser) return false;

  // Cannot manage OWNER
  if (targetUser.role === UserRole.OWNER) return false;

  // ADMIN can manage STAFF
  if (currentUser.role === UserRole.ADMIN && targetUser.role === UserRole.STAFF) {
    return true;
  }

  // Can manage self
  if (currentUser.id === targetUserId) return true;

  return false;
}

/**
 * Check if a user is the last active Owner.
 */
export async function isLastActiveOwner(userId: string): Promise<boolean> {
  if (!db) return false;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== UserRole.OWNER) return false;

  const activeOwnerCount = await db.user.count({
    where: {
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      id: { not: userId },
    },
  });

  return activeOwnerCount === 0;
}

// ============== AUDIT LOGGING ==============

interface AuditLogEntry {
  action: string;
  targetType: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  beforeValues?: Record<string, unknown>;
  afterValues?: Record<string, unknown>;
}

/**
 * Create an audit log entry.
 */
export async function createAuditLog(entry: AuditLogEntry) {
  if (!db) {
    console.log("[Audit]", entry);
    return;
  }

  try {
    const user = await getCurrentUser();

    await db.auditLog.create({
      data: {
        actorId: user?.id,
        actorEmail: user?.email,
        actorRole: user?.role,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        targetLabel: entry.targetLabel,
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
        beforeValues: entry.beforeValues as Prisma.InputJsonValue | undefined,
        afterValues: entry.afterValues as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("[Audit] Could not save audit log:", error);
  }
}

// ============== INVITATION UTILITIES ==============

/**
 * Generate a cryptographically secure invitation token.
 */
export function generateInvitationToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a short alphanumeric invite code (6 chars) for branded invite links.
 * Uses a clean character set that avoids confusing characters (I, O, 0, 1).
 */
export function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Ensure a short code is unique in the database.
 */
export async function ensureUniqueShortCode(): Promise<string> {
  if (!db) return "DEV" + Math.random().toString(36).slice(2, 6).toUpperCase();
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateShortCode();
    const existing = await db.invitation.findUnique({ where: { shortCode: code } });
    if (!existing) return code;
  }
  // Fallback: extremely unlikely to reach here
  return generateShortCode() + Math.random().toString(36).slice(2, 4).toUpperCase();
}

/**
 * Hash a token for secure storage.
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a new invitation.
 */
export async function createInvitation(params: {
  email: string;
  name: string;
  role: UserRole;
  permissions?: Permission[];
  invitedById: string;
  phone?: string;
  note?: string;
  expiresInHours?: number;
}) {
  if (!db) throw new Error("Database not available");

  const {
    email,
    name,
    role,
    permissions,
    invitedById,
    phone,
    note,
    expiresInHours = 168, // 7 days
  } = params;

  // Generate token and hash
  const token = generateInvitationToken();
  const tokenHash = await hashToken(token);

  // Generate short code
  const shortCode = await ensureUniqueShortCode();

  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  // Create invitation record
  const invitation = await db.invitation.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role,
      permissions: permissions as unknown as any,
      tokenHash,
      shortCode,
      status: InvitationStatus.PENDING,
      expiresAt,
      invitedById,
      phone,
      note,
    },
  });

  // Create audit log
  await createAuditLog({
    action: "invitation.created",
    targetType: "invitation",
    targetId: invitation.id,
    targetLabel: email,
    metadata: { role, expiresAt, shortCode },
  });

  return { invitation, token, shortCode };
}

/**
 * Validate an invitation token.
 */
export async function validateInvitationToken(token: string) {
  if (!db) return null;

  const tokenHash = await hashToken(token);

  const invitation = await db.invitation.findUnique({
    where: { tokenHash },
    include: { invitedBy: { select: { name: true, email: true } } },
  });

  if (!invitation) return null;

  // Check if expired
  if (invitation.expiresAt < new Date()) {
    // Update status to expired
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    return null;
  }

  // Check if already accepted or revoked
  if (invitation.status !== InvitationStatus.PENDING) {
    return null;
  }

  return invitation;
}

/**
 * Find an invitation by its short code.
 */
export async function findInvitationByShortCode(shortCode: string) {
  if (!db) return null;

  const invitation = await db.invitation.findUnique({
    where: { shortCode: shortCode.toUpperCase() },
    include: { invitedBy: { select: { name: true, email: true } } },
  });

  if (!invitation) return null;

  // Check if expired
  if (invitation.expiresAt < new Date()) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    return null;
  }

  // Check if already accepted or revoked
  if (invitation.status !== InvitationStatus.PENDING) {
    return null;
  }

  return invitation;
}

/**
 * Accept an invitation and create the user account.
 */
export async function acceptInvitation(params: {
  token: string;
  name: string;
  password: string;
}) {
  if (!db) throw new Error("Database not available");

  const { token, name, password } = params;

  // Validate invitation
  const invitation = await validateInvitationToken(token);
  if (!invitation) {
    throw new Error("Invalid or expired invitation");
  }

  return await acceptInvitationInternal(invitation, name, password);
}

/**
 * Accept an invitation by short code and create the user account.
 */
export async function acceptInvitationByCode(params: {
  code: string;
  name: string;
  password: string;
}) {
  if (!db) throw new Error("Database not available");

  const { code, name, password } = params;

  const invitation = await findInvitationByShortCode(code.toUpperCase());
  if (!invitation) {
    throw new Error("Invalid or expired invitation");
  }

  return await acceptInvitationInternal(invitation, name, password);
}

/**
 * Internal: create user account from a validated invitation.
 */
async function acceptInvitationInternal(
  invitation: any,
  name: string,
  password: string,
) {
  if (!db) throw new Error("Database not available");

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: invitation.email },
  });

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  // Hash password
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: invitation.email,
        name: name.trim(),
        role: invitation.role,
        status: UserStatus.ACTIVE,
        permissions: invitation.permissions === null
          ? undefined
          : invitation.permissions as Prisma.InputJsonValue,
        invitedById: invitation.invitedById,
        emailVerified: true,
      },
    });

    await tx.account.create({
      data: {
        userId: createdUser.id,
        providerId: "credential",
        accountId: createdUser.id,
        password: passwordHash,
      },
    });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
        acceptedById: createdUser.id,
      },
    });

    return createdUser;
  });

  // Create audit log
  await createAuditLog({
    action: "invitation.accepted",
    targetType: "invitation",
    targetId: invitation.id,
    targetLabel: invitation.email,
    metadata: { userId: user.id },
  });

  return { user, invitation };
}

// ============== PASSWORD RESET UTILITIES ==============

/**
 * Generate a password reset token.
 */
export async function createPasswordResetToken(email: string) {
  if (!db) throw new Error("Database not available");

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    // Don't reveal whether email exists
    return null;
  }

  // Generate token
  const token = generateInvitationToken();
  const tokenHash = await hashToken(token);

  // Expires in 1 hour
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Delete any existing tokens for this email
  await db.passwordReset.deleteMany({
    where: { email: normalizedEmail },
  });

  // Create new token
  await db.passwordReset.create({
    data: {
      email: normalizedEmail,
      tokenHash,
      expiresAt,
    },
  });

  return { token, email: normalizedEmail };
}

/**
 * Validate a password reset token.
 */
export async function validatePasswordResetToken(token: string) {
  if (!db) return null;

  const tokenHash = await hashToken(token);

  const reset = await db.passwordReset.findUnique({
    where: { tokenHash },
  });

  if (!reset) return null;
  if (reset.usedAt) return null;
  if (reset.expiresAt < new Date()) return null;

  return reset;
}

/**
 * Reset password using token.
 */
export async function resetPassword(params: {
  token: string;
  newPassword: string;
}) {
  if (!db) throw new Error("Database not available");

  const { token, newPassword } = params;

  const reset = await validatePasswordResetToken(token);
  if (!reset) {
    throw new Error("Invalid or expired reset token");
  }

  const credential = await db.account.findFirst({
    where: {
      user: { email: reset.email },
      providerId: "credential",
    },
    select: { password: true },
  });
  if (await passwordMatchesHash(newPassword, credential?.password)) {
    throw new Error(PASSWORD_REUSE_ERROR);
  }

  // Hash new password
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update user's password
  await db.account.updateMany({
    where: {
      user: { email: reset.email },
      providerId: "credential",
    },
    data: {
      password: passwordHash,
    },
  });

  // Mark token as used
  await db.passwordReset.update({
    where: { id: reset.id },
    data: { usedAt: new Date() },
  });

  const user = await db.user.findUnique({
    where: { email: reset.email },
    select: { id: true },
  });
  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: { mustChangePassword: false, passwordChangedAt: new Date() },
    });
    await db.session.deleteMany({ where: { userId: user.id } });
  }

  // Create audit log
  await createAuditLog({
    action: "password.reset",
    targetType: "user",
    targetLabel: reset.email,
  });

  return { email: reset.email };
}

// ============== SESSION MANAGEMENT ==============

/**
 * Revoke all sessions for a user.
 */
export async function revokeAllUserSessions(userId: string, exceptToken?: string) {
  if (!db) return;

  await db.session.deleteMany({
    where: {
      userId,
      ...(exceptToken ? { token: { not: exceptToken } } : {}),
    },
  });

  await createAuditLog({
    action: "sessions.revoked",
    targetType: "user",
    targetId: userId,
    metadata: { exceptToken: !!exceptToken },
  });
}

/**
 * Get active sessions for current user.
 */
export async function getActiveSessions() {
  const user = await getCurrentUser();
  if (!user || !db) return [];

  const sessions = await db.session.findMany({
    where: {
      userId: user.id,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    isCurrent: false, // Will be set by caller
  }));
}

/**
 * Revoke a specific session.
 */
export async function revokeSession(sessionId: string) {
  const user = await getCurrentUser();
  if (!user || !db) return false;

  // Ensure user can only revoke their own sessions
  const session = await db.session.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) return false;

  await db.session.delete({
    where: { id: sessionId },
  });

  return true;
}
