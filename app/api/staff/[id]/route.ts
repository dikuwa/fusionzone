/**
 * Staff Member API - Get, update, delete individual staff member.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  requirePermission,
  requireRole,
  createAuditLog,
  revokeAllUserSessions,
  canManageUser,
  getCurrentUser,
} from "@/lib/auth-server";
import { db } from "@/lib/db";
import { InvitationStatus, UserRole, UserStatus } from "@/lib/enums";
import { Permissions, type Permission } from "@/lib/permissions";
import { sendAccountStatusEmail } from "@/lib/email";
import { sendAccountStatusWhatsApp } from "@/lib/whatsapp";

// Validation schema for updates
const updateStaffSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  permissions: z.array(z.enum(Object.values(Permissions) as [Permission, ...Permission[]])).optional(),
});

/**
 * GET /api/staff/[id]
 * Get a specific staff member.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requirePermission(Permissions.USERS_VIEW);

    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        jobTitle: true,
        phone: true,
        role: true,
        status: true,
        permissions: true,
        twoFactorEnabled: true,
        lastActiveAt: true,
        invitedById: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if can view this user
    const currentUser = await getCurrentUser();
    if (user.role === UserRole.OWNER && currentUser?.role !== UserRole.OWNER) {
      return NextResponse.json(
        { error: "Cannot view OWNER" },
        { status: 403 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[API] GET /api/staff/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/staff/[id]
 * Update a staff member.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requirePermission(Permissions.USERS_EDIT);

    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Check if can manage this user
    const canManage = await canManageUser(id);
    if (!canManage) {
      return NextResponse.json(
        { error: "Cannot modify this user" },
        { status: 403 }
      );
    }

    // Parse and validate body
    const body = await req.json();
    const result = updateStaffSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, role, status, permissions } = result.data;

    // If changing permissions, require the manage_permissions permission
    if (permissions) {
      await requirePermission(Permissions.USERS_MANAGE_PERMISSIONS);

      // Block Admin/Staff from granting restricted permissions
      const restrictedPermissions: string[] = [
        Permissions.USERS_DELETE,
        Permissions.PAYMENTS_VIEW,
        Permissions.PAYMENTS_CREATE,
        Permissions.PAYMENTS_UPDATE,
        Permissions.PAYMENTS_REFUND,
        Permissions.PAYMENTS_EXPORT,
        Permissions.DASHBOARD_VIEW_FINANCIAL_SUMMARY,
      ];

      const hasRestricted = permissions.some((p) => restrictedPermissions.includes(p));
      if (hasRestricted && currentUser.role !== UserRole.OWNER) {
        return NextResponse.json(
          { error: "Only the Owner can grant delete or financial permissions." },
          { status: 403 }
        );
      }

      // Admin cannot grant financial permissions to themselves or other Admin
      if (currentUser.role === UserRole.ADMIN && role !== UserRole.STAFF) {
        const financialPerms: string[] = [
          Permissions.PAYMENTS_VIEW,
          Permissions.PAYMENTS_CREATE,
          Permissions.PAYMENTS_UPDATE,
          Permissions.PAYMENTS_REFUND,
          Permissions.PAYMENTS_EXPORT,
          Permissions.DASHBOARD_VIEW_FINANCIAL_SUMMARY,
        ];
        const hasFinancial = permissions.some((p) => financialPerms.includes(p));
        if (hasFinancial) {
          return NextResponse.json(
            { error: "Admin cannot grant financial permissions. Only the Owner can assign financial access." },
            { status: 403 }
          );
        }
      }
    }

    // Self-modification restrictions
    if (id === currentUser.id && (role || status || permissions)) {
      return NextResponse.json(
        { error: "Role, status, and permission changes require another authorized administrator" },
        { status: 403 }
      );
    }

    // Get current user data for audit log
    const targetUser = await db.user.findUnique({
      where: { id },
      select: { name: true, email: true, role: true, status: true, permissions: true, phone: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (targetUser.role === UserRole.OWNER && currentUser.role !== UserRole.OWNER) {
      return NextResponse.json(
        { error: "Only an Owner can modify another Owner account" },
        { status: 403 }
      );
    }

    // Prevent granting OWNER role
    if (role === UserRole.OWNER && currentUser.role !== UserRole.OWNER) {
      return NextResponse.json(
        { error: "Only OWNER can grant OWNER role" },
        { status: 403 }
      );
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(status && { status }),
        ...(permissions && { permissions: permissions as any }),
      },
    });

    // Handle status change side effects
    if (status === UserStatus.SUSPENDED) {
      // Revoke all sessions
      await revokeAllUserSessions(id);

      // Send notifications
      try {
        await sendAccountStatusEmail({
          to: targetUser.email,
          name: targetUser.name,
          status: "suspended",
        });
      } catch (emailError) {
        console.error("[API] Failed to send suspension email:", emailError);
      }
      if (targetUser.phone) {
        try {
          await sendAccountStatusWhatsApp(targetUser.phone, targetUser.name, "suspended");
        } catch (whatsappError) {
          console.error("[API] Failed to send suspension WhatsApp:", whatsappError);
        }
      }
    } else if (status === UserStatus.ACTIVE && targetUser.status === UserStatus.SUSPENDED) {
      // Send notifications
      try {
        await sendAccountStatusEmail({
          to: targetUser.email,
          name: targetUser.name,
          status: "reactivated",
        });
      } catch (emailError) {
        console.error("[API] Failed to send reactivation email:", emailError);
      }
      if (targetUser.phone) {
        try {
          await sendAccountStatusWhatsApp(targetUser.phone, targetUser.name, "reactivated");
        } catch (whatsappError) {
          console.error("[API] Failed to send reactivation WhatsApp:", whatsappError);
        }
      }
    }

    // Create audit log
    await createAuditLog({
      action: "user.updated",
      targetType: "user",
      targetId: id,
      targetLabel: targetUser.name,
      beforeValues: {
        name: targetUser.name,
        role: targetUser.role,
        status: targetUser.status,
        permissions: targetUser.permissions,
      },
      afterValues: {
        name: name || targetUser.name,
        role: role || targetUser.role,
        status: status || targetUser.status,
        permissions: permissions || targetUser.permissions,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("[API] PATCH /api/staff/[id] error:", error);

    if (error instanceof Error && error.message.includes("Permission")) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update staff" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff/[id]
 * Permanently hard-delete a user (Owner only).
 * - Only Owner can delete users
 * - Admin/Staff are blocked even if they have USERS_DELETE permission
 * - A user cannot delete themselves
 * - Cannot delete the last remaining active Owner
 * - All associated records (sessions, accounts, etc.) are cascade-deleted
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Require USERS_DELETE permission first
    const currentUser = await requirePermission(Permissions.USERS_DELETE);

    // Only Owner can delete users — block Admin/Staff even if permission assigned
    if (currentUser.role !== UserRole.OWNER) {
      return NextResponse.json(
        { error: "Only the Owner can delete users. This action requires the Owner role." },
        { status: 403 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Cannot delete self
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 403 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id },
      select: { name: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Protect the last remaining active Owner
    if (targetUser.role === UserRole.OWNER) {
      const activeOwnerCount = await db.user.count({
        where: { role: UserRole.OWNER, status: UserStatus.ACTIVE },
      });
      if (activeOwnerCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last active Owner account. Create another Owner first." },
          { status: 409 }
        );
      }
    }

    // HARD DELETE: Remove the user and cascade-deleted associated records.
    // Records that reference this user (payments, receipts, follow-ups) are
    // reassigned to the deleting Owner so business history is preserved.
    // Audit logs are preserved for historical purposes (actorId is set to null).
    await db.$transaction(async (tx) => {
      // Reassign business records that reference this user to the deleting Owner
      await tx.paymentRecord.updateMany({
        where: { recordedById: id },
        data: { recordedById: currentUser.id },
      });

      await tx.receipt.updateMany({
        where: { issuedById: id },
        data: { issuedById: currentUser.id },
      });

      await tx.followUp.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: currentUser.id },
      });

      // Preserve audit logs by disassociating them
      await tx.auditLog.updateMany({
        where: { actorId: id },
        data: { actorId: null },
      });

      // Delete notifications
      await tx.notification.deleteMany({ where: { userId: id } });

      // Delete the user (cascades sessions, accounts, twoFactor via Prisma)
      await tx.user.delete({ where: { id } });

      // Revoke any pending invitations for this user's email
      await tx.invitation.updateMany({
        where: { email: targetUser.email, status: InvitationStatus.PENDING },
        data: { status: InvitationStatus.REVOKED },
      });
    });

    // Create audit log (actor still exists since they're performing the action)
    await createAuditLog({
      action: "user.hard_deleted",
      targetType: "user",
      targetId: id,
      targetLabel: targetUser.name,
      metadata: { email: targetUser.email, role: targetUser.role },
    });

    return NextResponse.json({ success: true, message: "User permanently deleted." });
  } catch (error) {
    console.error("[API] DELETE /api/staff/[id] error:", error);

    if (error instanceof Error && error.message.includes("Permission")) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
