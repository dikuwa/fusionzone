/**
 * POST /api/staff/[id]/set-temporary-password
 * Sets a temporary password for a user and forces password change on next login.
 * Requires USERS_EDIT permission.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, canManageUser, revokeAllUserSessions, createAuditLog } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Permissions } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { PASSWORD_REUSE_ERROR, passwordMatchesHash } from "@/lib/password-policy";

const setPasswordSchema = z.object({
  password: z.string().min(10).max(128),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requirePermission(Permissions.USERS_EDIT);

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    // Check if can manage this user
    const canManage = await canManageUser(id);
    if (!canManage) {
      return NextResponse.json({ error: "Cannot manage this user" }, { status: 403 });
    }

    const targetUser = await db.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate body
    const body = await req.json();
    const result = setPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Password must be at least 10 characters" },
        { status: 400 }
      );
    }

    const { password } = result.data;

    const existingCredential = await db.account.findFirst({
      where: { userId: id, providerId: "credential" },
      select: { password: true },
    });
    if (await passwordMatchesHash(password, existingCredential?.password)) {
      return NextResponse.json({ error: PASSWORD_REUSE_ERROR }, { status: 400 });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update the user's credential and force password change
    await db.account.upsert({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: id,
        },
      },
      update: {
        userId: id,
        password: passwordHash,
      },
      create: {
        userId: id,
        providerId: "credential",
        accountId: id,
        password: passwordHash,
      },
    });

    await db.user.update({
      where: { id },
      data: { mustChangePassword: true },
    });

    // Revoke all existing sessions so user must log in with the new password
    await revokeAllUserSessions(id);

    // Create audit log (do NOT log the password)
    await createAuditLog({
      action: "user.temporary_password_set",
      targetType: "user",
      targetId: id,
      targetLabel: targetUser.name,
      metadata: { setById: currentUser.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] POST /api/staff/[id]/set-temporary-password error:", error);

    if (error instanceof Error && error.message.includes("Permission")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to set temporary password" },
      { status: 500 }
    );
  }
}
