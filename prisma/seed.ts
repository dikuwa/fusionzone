/**
 * Prisma seed script — populates the database with initial sample data.
 * Run with: tsx prisma/seed.ts
 *
 * Note: Requires DATABASE_URL.
 * Run `prisma db push` first to ensure tables exist.
 */

import { parseHumanToCents } from "../lib/format";
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

  // Create categories
  const categories = [
    { name: "Apple", slug: "apple", description: "MacBooks, iPads, iPhones", sortOrder: 1 },
    { name: "Windows", slug: "windows", description: "Dell, HP, Lenovo laptops", sortOrder: 2 },
    { name: "Gaming", slug: "gaming", description: "Gaming desktops and laptops", sortOrder: 3 },
    { name: "CCTV & Security", slug: "cctv", description: "Cameras and security systems", sortOrder: 4 },
    { name: "Networking", slug: "networking", description: "Routers, switches, WiFi", sortOrder: 5 },
    { name: "Phones & Tablets", slug: "phones", description: "Smartphones and tablets", sortOrder: 6 },
    { name: "Accessories", slug: "accessories", description: "Headsets, mice, keyboards", sortOrder: 7 },
    { name: "POS Systems", slug: "pos", description: "POS hardware and peripherals", sortOrder: 8 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.name] = created.id;
  }

  console.log("  ✓ Categories created");

  // Create products
  const products = [
    { name: 'MacBook Air 15" M3', slug: "macbook-air-15-m3", sku: "DT-001", brand: "Apple", category: "Apple", priceCents: parseHumanToCents("18999"), stockQuantity: 8, lowStockThreshold: 3, isFeatured: true, description: "Latest MacBook Air with M3 chip. 15-inch Liquid Retina display, 18GB RAM, 512GB SSD.", specifications: "15.3\" display • Apple M3 • 18GB RAM • 512GB SSD • 18h battery" },
    { name: "Dell XPS 16", slug: "dell-xps-16", sku: "DT-002", brand: "Dell", category: "Windows", priceCents: parseHumanToCents("25999"), stockQuantity: 2, lowStockThreshold: 3, isFeatured: true, description: "Premium Windows laptop with Intel Core Ultra 7, 32GB RAM, 1TB SSD.", specifications: "16\" OLED • Intel Core Ultra 7 • 32GB RAM • 1TB SSD • Windows 11 Pro" },
    { name: "Gaming PC Ryzen 7", slug: "gaming-pc-ryzen-7-rtx-4070", sku: "DT-003", brand: "Custom Build", category: "Gaming", priceCents: parseHumanToCents("21999"), stockQuantity: 5, lowStockThreshold: 3, isFeatured: true, description: "High-performance gaming PC with Ryzen 7 and RTX 4070.", specifications: "Ryzen 7 7800X3D • RTX 4070 • 32GB DDR5 • 1TB NVMe • Win 11 Home" },
    { name: "iPad Pro 13\" M4", slug: "ipad-pro-13-m4", sku: "DT-004", brand: "Apple", category: "Apple", priceCents: parseHumanToCents("16499"), stockQuantity: 0, lowStockThreshold: 3, isFeatured: true, description: "Latest iPad Pro with M4 chip and Ultra Retina XDR display.", specifications: "13\" Ultra Retina XDR • Apple M4 • 256GB • Wi-Fi 6E • USB-C" },
    { name: "Samsung Galaxy S25 Ultra", slug: "samsung-galaxy-s25-ultra", sku: "DT-005", brand: "Samsung", category: "Phones & Tablets", priceCents: parseHumanToCents("18599"), stockQuantity: 12, lowStockThreshold: 3, isFeatured: true, description: "Samsung's flagship smartphone with advanced AI features.", specifications: "6.9\" Dynamic AMOLED • Snapdragon 8 Gen 4 • 256GB • 200MP Camera" },
    { name: "Hikvision 8CH CCTV Kit", slug: "hikvision-8ch-cctv-kit", sku: "DT-006", brand: "Hikvision", category: "CCTV & Security", priceCents: parseHumanToCents("5999"), stockQuantity: 4, lowStockThreshold: 3, isFeatured: true, description: "Complete 8-channel CCTV kit with 4 cameras and 2TB storage.", specifications: "8CH NVR • 4× 4MP Cameras • 2TB HDD • Night Vision • Mobile App" },
    { name: "Lenovo ThinkPad X1 Carbon", slug: "lenovo-thinkpad-x1-carbon", sku: "DT-007", brand: "Lenovo", category: "Windows", priceCents: parseHumanToCents("12999"), stockQuantity: 1, lowStockThreshold: 3, isFeatured: false, description: "Business ultrabook with Intel Core i7, 16GB RAM, 512GB SSD.", specifications: "14\" WUXGA • Intel Core i7 • 16GB RAM • 512GB SSD • Win 11 Pro" },
    { name: "Logitech MX Master 3S", slug: "logitech-mx-master-3s", sku: "DT-008", brand: "Logitech", category: "Accessories", priceCents: parseHumanToCents("1599"), stockQuantity: 25, lowStockThreshold: 5, isFeatured: false, description: "Premium wireless mouse with quiet clicks and 8K DPI.", specifications: "Wireless • 8K DPI • Quiet Clicks • USB-C • 70h Battery • Multi-Device" },
    { name: 'MacBook Pro 14" M4 Pro', slug: "macbook-pro-14-m4-pro", sku: "DT-009", brand: "Apple", category: "Apple", priceCents: parseHumanToCents("27999"), stockQuantity: 3, lowStockThreshold: 3, isFeatured: false, description: "Professional laptop with M4 Pro chip for demanding workflows.", specifications: "14\" Liquid Retina XDR • Apple M4 Pro • 24GB RAM • 512GB SSD" },
    { name: "ASUS ROG Strix G16", slug: "asus-rog-strix-g16", sku: "DT-010", brand: "ASUS", category: "Gaming", priceCents: parseHumanToCents("22499"), stockQuantity: 1, lowStockThreshold: 3, isFeatured: false, description: "Gaming laptop with RTX 4070 and high-refresh display.", specifications: "16\" QHD 240Hz • Intel i9 • RTX 4070 • 16GB DDR5 • 1TB SSD • Win 11" },
    { name: "iPhone 16 Pro Max", slug: "iphone-16-pro-max", sku: "DT-011", brand: "Apple", category: "Phones & Tablets", priceCents: parseHumanToCents("21999"), stockQuantity: 0, lowStockThreshold: 3, isFeatured: false, description: "The most advanced iPhone ever with A18 Pro, 48MP camera system, and titanium design.", specifications: "6.9\" OLED • A18 Pro • 256GB • Titanium • 48MP Camera" },
  ];

  for (const product of products) {
    const categoryId = createdCategories[product.category];
    if (!categoryId) {
      console.warn(`  ⚠  Category "${product.category}" not found for product "${product.name}"`);
      continue;
    }
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        brand: product.brand,
        categoryId,
        priceCents: product.priceCents,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        isFeatured: product.isFeatured,
        isPublished: true,
        description: product.description,
        specifications: product.specifications,
        availability: product.stockQuantity > 0 ? "InStock" : "OutOfStock",
      },
    });
  }

  console.log("  ✓ Products created");

  // Create promotions
  const promotions = [
    {
      title: "Gaming Setup Bundle",
      slug: "gaming-bundle",
      description: "Complete gaming rig bundle with PC, monitor, keyboard, mouse and headset. Save up to N$ 2,000!",
      discountLabel: "Save up to N$ 2,000",
      placement: "HomeHero",
      isActive: true,
    },
    {
      title: "Back to School Special",
      slug: "back-to-school",
      description: "Student discounts on select laptops and accessories. Up to 15% off!",
      discountLabel: "Up to 15% off",
      placement: "FeaturedSection",
      isActive: true,
    },
    {
      title: "CCTV Bundle Deals",
      slug: "cctv-bundle",
      description: "Security camera bundles with installation support. Save up to N$ 1,500.",
      discountLabel: "Save up to N$ 1,500",
      placement: "FeaturedSection",
      isActive: false,
    },
  ];

  for (const promo of promotions) {
    await prisma.promotion.upsert({
      where: { slug: promo.slug },
      update: {},
      create: promo,
    });
  }

  console.log("  ✓ Promotions created");

  // Create back-in-stock requests
  const ipadPro = await prisma.product.findUnique({ where: { slug: "ipad-pro-13-m4" } });
  const iphone16 = await prisma.product.findUnique({ where: { slug: "iphone-16-pro-max" } });

  if (ipadPro) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "BackInStockRequest" ("id", "productId", "productName", "customerName", "preferredContact", "contactValue", "urgency", "note", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT ("id") DO NOTHING`,
      "seed-bis-1", ipadPro.id, 'iPad Pro 13" M4', "Helena Ndapanda", "WhatsApp", "264811234567", "ASAP", "Need for school, starting next week", "New",
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "BackInStockRequest" ("id", "productId", "productName", "customerName", "preferredContact", "contactValue", "urgency", "note", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT ("id") DO NOTHING`,
      "seed-bis-2", ipadPro.id, 'iPad Pro 13" M4', "Tomas Shikongo", "Email", "tomas@example.com", "Flexible", "Would like to know when back in stock", "New",
    );
    console.log("  ✓ Back-in-stock requests for iPad Pro 13\" M4");
  }

  if (iphone16) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "BackInStockRequest" ("id", "productId", "productName", "customerName", "preferredContact", "contactValue", "urgency", "note", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT ("id") DO NOTHING`,
      "seed-bis-3", iphone16.id, "iPhone 16 Pro Max", "Maria Kambonde", "Phone", "264852345678", "JustChecking", null, "ReadyToContact",
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "BackInStockRequest" ("id", "productId", "productName", "customerName", "preferredContact", "contactValue", "urgency", "note", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT ("id") DO NOTHING`,
      "seed-bis-4", iphone16.id, "iPhone 16 Pro Max", "Petrus Nangolo", "WhatsApp", "264813456789", "ASAP", "Upgrading from iPhone 13", "Contacted",
    );
    console.log("  ✓ Back-in-stock requests for iPhone 16 Pro Max");
  }

  console.log("\n✅ Database seeded successfully!");
  console.log("   Owner login: owner@fusionzone.example");
  console.log("   Admin login: admin@fusionzone.example");
  console.log("   Staff login: staff@fusionzone.example");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    console.log("Done.");
  });
