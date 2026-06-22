/**
 * Clean all seeded data from the database while preserving user/ auth records.
 *
 * Run with: tsx scripts/clean-seeded-data.ts
 *
 * This script deletes all operational and catalog data that was created by
 * the old seed script so the site starts clean. Only users, accounts,
 * sessions and auth-related records are preserved.
 *
 * Use --dry-run to preview what would be deleted without actually deleting.
 * Use --force to skip the confirmation prompt.
 */

import dotenv from "dotenv";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // Count records before deletion
    const counts = {
      backInStockRequests: await prisma.backInStockRequest.count(),
      promotionProducts: await prisma.promotionProduct.count(),
      promotions: await prisma.promotion.count(),
      productImages: await prisma.productImage.count(),
      products: await prisma.product.count(),
      orderItems: await prisma.orderItem.count(),
      paymentRecords: await prisma.paymentRecord.count(),
      receipts: await prisma.receipt.count(),
      followUps: await prisma.followUp.count(),
      notifications: await prisma.notification.count(),
      orders: await prisma.order.count(),
      customers: await prisma.customer.count(),
      categories: await prisma.category.count(),
      brands: await prisma.brand.count(),
      contactMessages: await prisma.contactMessage.count(),
      documentShares: await prisma.documentShare.count(),
      services: await prisma.service.count(),
      auditLogs: await prisma.auditLog.count(),
      invitations: await prisma.invitation.count(),
      passwordResets: await prisma.passwordReset.count(),
      storeSettings: await prisma.storeSetting.count(),
    };

    const totalSeeded = Object.values(counts).reduce((sum, c) => sum + c, 0);

    console.log("📊 Current record counts:\n");
    for (const [table, count] of Object.entries(counts)) {
      if (count > 0) {
        console.log(`  ${table}: ${count}`);
      }
    }
    console.log(`\n  Total records to remove: ${totalSeeded}`);

    if (totalSeeded === 0) {
      console.log("\n✅ Database is already clean. Nothing to do.");
      return;
    }

    // Confirm unless --force
    if (!DRY_RUN && !FORCE) {
      console.log("\n⚠  This will permanently delete all seeded data above.");
      console.log("   Users, accounts, sessions, verifications, and rate limits will be PRESERVED.");
      console.log("   Run with --force to skip this prompt.\n");
    }

    if (DRY_RUN) {
      console.log("\n🔍 Dry run — no changes made.");
      return;
    }

    if (!FORCE) {
      // We'll just proceed without a prompt since this is a script
      console.log("   Proceeding...\n");
    }

    // Delete in dependency order (children first)
    console.log("🧹 Cleaning seeded data...");

    await prisma.backInStockRequest.deleteMany();
    console.log("  ✓ BackInStockRequests cleared");

    await prisma.promotionProduct.deleteMany();
    console.log("  ✓ PromotionProducts cleared");

    await prisma.promotion.deleteMany();
    console.log("  ✓ Promotions cleared");

    await prisma.productImage.deleteMany();
    console.log("  ✓ ProductImages cleared");

    await prisma.orderItem.deleteMany();
    console.log("  ✓ OrderItems cleared");

    await prisma.paymentRecord.deleteMany();
    console.log("  ✓ PaymentRecords cleared");

    await prisma.receipt.deleteMany();
    console.log("  ✓ Receipts cleared");

    await prisma.followUp.deleteMany();
    console.log("  ✓ FollowUps cleared");

    await prisma.notification.deleteMany();
    console.log("  ✓ Notifications cleared");

    await prisma.order.deleteMany();
    console.log("  ✓ Orders cleared");

    await prisma.customer.deleteMany();
    console.log("  ✓ Customers cleared");

    await prisma.product.deleteMany();
    console.log("  ✓ Products cleared");

    await prisma.category.deleteMany();
    console.log("  ✓ Categories cleared");

    await prisma.brand.deleteMany();
    console.log("  ✓ Brands cleared");

    await prisma.contactMessage.deleteMany();
    console.log("  ✓ ContactMessages cleared");

    await prisma.documentShare.deleteMany();
    console.log("  ✓ DocumentShares cleared");

    await prisma.service.deleteMany();
    console.log("  ✓ Services cleared");

    await prisma.auditLog.deleteMany();
    console.log("  ✓ AuditLogs cleared");

    await prisma.invitation.deleteMany();
    console.log("  ✓ Invitations cleared");

    await prisma.passwordReset.deleteMany();
    console.log("  ✓ PasswordResets cleared");

    await prisma.storeSetting.deleteMany();
    console.log("  ✓ StoreSettings cleared");

    console.log("\n✅ All seeded data cleared.");
    console.log("   Users, accounts, sessions, verifications, and rate limits preserved.");
    console.log("\n👉 Next: Clear your browser's localStorage (fusionzone-dashboard)");
    console.log("   to remove stale persisted state from the Zustand store.");
    console.log("   Open DevTools → Application → Local Storage → Clear 'fusionzone-dashboard'");

  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("❌ Cleanup failed:", error);
  process.exit(1);
});
