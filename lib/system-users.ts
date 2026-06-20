import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { UserRole, UserStatus } from "@/lib/enums";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";

/**
 * System user accounts are used for initial bootstrap only.
 * In production, these passwords MUST be set via environment variables.
 * The seed script no longer auto-creates these on every deployment.
 */

function getPassword(envVar: string, fallbackEnvVar: string | null, label: string): string {
  // FUSIONZONE_* takes priority
  const pw = process.env[envVar] || (fallbackEnvVar ? process.env[fallbackEnvVar] : undefined);
  if (!pw) {
    throw new Error(
      `${envVar} is required for system user "${label}". ` +
      `Set it in .env.local or the deployment environment.`
    );
  }
  if (fallbackEnvVar && process.env[fallbackEnvVar] && !process.env[envVar]) {
    console.warn(
      `[system-users] WARNING: Using deprecated ${fallbackEnvVar} for ${label}. ` +
      `Rename to ${envVar}.`
    );
  }
  return pw;
}

export const SYSTEM_USERS = [
  {
    name: "FusionZone Owner",
    email: "owner@fusionzone.example",
    passwordEnvVar: "FUSIONZONE_OWNER_PASSWORD",
    fallbackEnvVar: "DESERTTECH_OWNER_PASSWORD" as string | null,
    role: UserRole.OWNER,
  },
  {
    name: "FusionZone Admin",
    email: "admin@fusionzone.example",
    passwordEnvVar: "FUSIONZONE_ADMIN_PASSWORD",
    fallbackEnvVar: "DESERTTECH_ADMIN_PASSWORD" as string | null,
    role: UserRole.ADMIN,
  },
  {
    name: "FusionZone Staff",
    email: "staff@fusionzone.example",
    passwordEnvVar: "FUSIONZONE_STAFF_PASSWORD",
    fallbackEnvVar: "DESERTTECH_STAFF_PASSWORD" as string | null,
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
    const password = getPassword(systemUser.passwordEnvVar, systemUser.fallbackEnvVar, systemUser.email);

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
        mustChangePassword: false,
        permissions: DEFAULT_ROLE_PERMISSIONS[systemUser.role],
        ...((options.resetPasswords || isLegacySeed) && { twoFactorEnabled: false }),
      },
      create: {
        name: systemUser.name,
        email: systemUser.email,
        role: systemUser.role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        mustChangePassword: false,
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
