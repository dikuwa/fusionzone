/**
 * Prisma seed script — populates the database with initial sample data.
 * Run with: tsx prisma/seed.ts
 *
 * Note: Requires DATABASE_URL.
 * Run `prisma db push` first to ensure tables exist.
 */

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "path";

// Load .env.local so the seed script can access DATABASE_URL and ADMIN_* vars
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

/**
 * NOTE: System users are no longer auto-created by this seed script.
 * Run `tsx scripts/bootstrap-system-users.ts` explicitly after setting
 * DESERTTECH_OWNER_PASSWORD, DESERTTECH_ADMIN_PASSWORD, and
 * DESERTTECH_STAFF_PASSWORD environment variables.
 */

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seeding database...");
  console.log("  ⚠  System users not created by seed. Run `tsx scripts/bootstrap-system-users.ts` to create them.");

  console.log("  ✓ No seed data — categories, brands, products, and promotions are managed through the dashboard.");

  console.log("\n✅ Database seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    console.log("Done.");
  });
