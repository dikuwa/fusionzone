/**
 * GET /api/settings — Fetch store settings
 * POST /api/settings — Save store settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getStoreSettings, saveStoreSettings } from "@/lib/store-settings";
import { authorizePermission, createAuditLog } from "@/lib/auth-server";
import { Permissions } from "@/lib/permissions";
import { z } from "zod";

const contactDetailSchema = z.object({
  id: z.string(),
  type: z.enum(["phone", "whatsapp", "email", "address"]),
  label: z.string(),
  value: z.string(),
  isActive: z.boolean(),
});

const bankDetailSchema = z.object({
  id: z.string(),
  bankName: z.string(),
  accountName: z.string(),
  accountNumber: z.string(),
  branchCode: z.string(),
  isActive: z.boolean(),
});

const paymentMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["BankTransfer", "Cash", "PhoneTransfer", "Card", "Other"]),
  details: z.string(),
  instructions: z.string().optional(),
  isActive: z.boolean(),
});

const settingsSchema = z.object({
  storeName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBranchCode: z.string().optional(),
  receiptPrefix: z.string().trim().min(1).max(12).regex(/^[a-z0-9]+$/i).optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  heroHeading: z.string().optional(),
  heroSubheading: z.string().optional(),
  heroImageUrl: z.string().optional(),
  contactDetails: z.array(contactDetailSchema).max(50).optional(),
  servicesPage: z.object({
    header: z.object({
      eyebrow: z.string().optional(),
      heading: z.string().optional(),
      description: z.string().optional(),
    }).optional(),
    supportCards: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      icon: z.string(),
      isEnabled: z.boolean(),
      sortOrder: z.number(),
    })).optional(),
    preOwnedTech: z.object({
      isEnabled: z.boolean().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      features: z.array(z.string()).optional(),
    }).optional(),
    bottomCta: z.object({
      heading: z.string().optional(),
      description: z.string().optional(),
      primaryCtaLabel: z.string().optional(),
      primaryCtaType: z.string().optional(),
      primaryCtaDest: z.string().nullable().optional(),
      secondaryCtaLabel: z.string().optional(),
      secondaryCtaType: z.string().optional(),
      secondaryCtaDest: z.string().nullable().optional(),
    }).optional(),
  }).optional(),
  bankDetails: z.array(bankDetailSchema).max(20).optional(),
  paymentMethods: z.array(paymentMethodSchema).max(30).optional(),
});

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json(
      { success: true, settings },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[Settings API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizePermission(Permissions.SETTINGS_UPDATE);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid settings data" },
        { status: 400 },
      );
    }

    const before = await getStoreSettings();
    const saved = await saveStoreSettings(parsed.data as any);
    await createAuditLog({
      action: "Store settings updated",
      targetType: "settings",
      targetId: "store-settings",
      targetLabel: "Store Settings",
      metadata: { changedFields: Object.keys(parsed.data) },
      beforeValues: Object.fromEntries(Object.keys(parsed.data).map((key) => [key, before[key as keyof typeof before]])),
      afterValues: Object.fromEntries(Object.keys(parsed.data).map((key) => [key, saved[key as keyof typeof saved]])),
    });
    return NextResponse.json({ success: true, settings: saved });
  } catch (error) {
    console.error("[Settings API] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save settings" },
      { status: 500 },
    );
  }
}
