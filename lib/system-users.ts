import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { UserRole, UserStatus } from "@/lib/enums";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";

/**
 * System user accounts are used for initial bootstrap only.
 * In production, these passwords MUST be set via environment variables.
 * The seed script no longer auto-creates these on every deployment.
 */

function requirePassword(envVar: string, label: string): string {
  const pw = process.env[envVar];
  if (!pw) {
    throw new Error(
      `${envVar} is required for system user "${label}". ` +
      `Set it in .env.local or the deployment environment.`
    );
  }
  return pw;
}

export const SYSTEM_USERS = [
  {
    name: "FusionZone Owner",
    email: "owner@fusionzone.example",
    passwordEnvVar: "DESERTTECH_OWNER_PASSWORD",
    role: UserRole.OWNER,
  },
  {
    name: "FusionZone Admin",
    email: "admin@fusionzone.example",
    passwordEnvVar: "DESERTTECH_ADMIN_PASSWORD",
    role: UserRole.ADMIN,
  },
  {
    name: "FusionZone Staff",
    email: "staff@fusionzone.example",
    passwordEnvVar: "DESERTTECH_STAFF_PASSWORD",
    role: UserRole.STAFF,
  },
] as const;

/**
 * Bootstrap system users.
 * Only runs when explicitly called — NOT automatically on every deployment.
 * This is safe to run in CI/CD pipelines when env vars are set.
 */
export async function ensureSystemUsers(
  prisma: PrismaClient,
  options: { resetPasswords?: boolean } = {},
) {
  for (const systemUser of SYSTEM_USERS) {
    const password = requirePassword(systemUser.passwordEnvVar, systemUser.email);

    const existingUser = await prisma.user.findUnique({
      where: { email: systemUser.email },
      select: { name: true, role: true },
    });

    // Skip if user exists and we're not resetting passwords
    if (existingUser && !options.resetPasswords) {
      console.log(`[system-users] ${systemUser.email} already exists, skipping.`);
      continue;
    }

    const isLegacySeed =
      Boolean(existingUser) &&
      (existingUser?.name !== systemUser.name || existingUser.role !== systemUser.role);

    const user = await prisma.user.upsert({
      where: { email: systemUser.email },
      update: {
        name: systemUser.name,
        role: systemUser.role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        permissions: DEFAULT_ROLE_PERMISSIONS[systemUser.role],
        ...((options.resetPasswords || isLegacySeed) && { twoFactorEnabled: false }),
      },
      create: {
        name: systemUser.name,
        email: systemUser.email,
        role: systemUser.role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        mustChangePassword: true,
        permissions: DEFAULT_ROLE_PERMISSIONS[systemUser.role],
      },
    });

    const credential = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    });

    // Always set password on create; optionally reset
    if (!credential || options.resetPasswords || isLegacySeed) {
      const hashed = await bcrypt.hash(password, 12);
      await prisma.$transaction([
        prisma.account.deleteMany({
          where: { userId: user.id, providerId: "credential" },
        }),
        prisma.account.create({
          data: {
            userId: user.id,
            providerId: "credential",
            accountId: user.id,
            password: hashed,
          },
        }),
        ...(options.resetPasswords || isLegacySeed
          ? [
              prisma.session.deleteMany({ where: { userId: user.id } }),
              prisma.twoFactor.deleteMany({ where: { userId: user.id } }),
            ]
          : []),
      ]);
    }
  }
}
