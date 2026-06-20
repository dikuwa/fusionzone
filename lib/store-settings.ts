/**
 * Server-side store settings helper.
 * Fetches saved store settings from the database.
 * Uses one normalized default record when no saved database record exists.
 *
 * Use this in API routes, server components, and PDF generation.
 * For client components, use useDashboardStore(s => s.settings) instead.
 */

import { db } from "@/lib/db";
import type { BankDetail, ContactDetail, PaymentMethod } from "@/lib/dashboard-data";
import { DEFAULT_SERVICES_PAGE_SETTINGS } from "@/lib/services";
import type { ServicesPageSettings } from "@/lib/services";

export interface StoreSettings {
  storeName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranchCode: string;
  receiptPrefix: string;
  lowStockThreshold: number;
  currency: string;
  heroHeading: string;
  heroSubheading: string;
  heroImageUrl: string;
  footerDescription: string;
  contactDetails: ContactDetail[];
  bankDetails: BankDetail[];
  paymentMethods: PaymentMethod[];
  // Services Page Settings
  servicesPage: ServicesPageSettings;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "FusionZone",
  phone: "+264 00 000 0000",
  whatsapp: "264000000000",
  email: "sales@fusionzone.example",
  address: "Windhoek, Namibia",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankBranchCode: "",
  receiptPrefix: "FZ",
  lowStockThreshold: 5,
  currency: "NAD",
  heroHeading: "",
  heroSubheading: "",
  heroImageUrl: "",
  footerDescription:
    "Namibia\u2019s trusted source for new, pre-owned, and refurbished technology products \u2014 laptops, phones, gaming, CCTV, networking, POS & more.",
  contactDetails: [
    { id: "cd1", type: "phone", label: "Main", value: "+264 00 000 0000", isActive: true },
    { id: "cd2", type: "whatsapp", label: "Sales", value: "264000000000", isActive: true },
    { id: "cd3", type: "email", label: "General", value: "sales@fusionzone.example", isActive: true },
    { id: "cd4", type: "address", label: "Physical", value: "Windhoek, Namibia", isActive: true },
  ],
  bankDetails: [],
  paymentMethods: [
    { id: "pm1", name: "Bank Transfer", type: "BankTransfer", details: "Configure FusionZone banking details before accepting transfers", instructions: "Use your order reference as payment reference", isActive: false },
    { id: "pm2", name: "Cash at Store", type: "Cash", details: "Pay in person at our Windhoek location", isActive: true },
    { id: "pm3", name: "Phone Transfer (E-Wallet)", type: "PhoneTransfer", details: "Send via mobile money or e-wallet", instructions: "Contact us for the phone number to send to", isActive: true },
  ],
  servicesPage: DEFAULT_SERVICES_PAGE_SETTINGS,
};

export function normalizeStoreSettings(data: Partial<StoreSettings>): StoreSettings {
  const receiptPrefix = String(data.receiptPrefix ?? DEFAULT_STORE_SETTINGS.receiptPrefix)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
  const threshold = Number(data.lowStockThreshold);

  return {
    ...DEFAULT_STORE_SETTINGS,
    ...data,
    receiptPrefix: receiptPrefix || DEFAULT_STORE_SETTINGS.receiptPrefix,
    lowStockThreshold: Number.isInteger(threshold) && threshold >= 0
      ? threshold
      : DEFAULT_STORE_SETTINGS.lowStockThreshold,
    currency: String(data.currency ?? DEFAULT_STORE_SETTINGS.currency).trim().toUpperCase() || "NAD",
    contactDetails: Array.isArray(data.contactDetails) ? data.contactDetails : DEFAULT_STORE_SETTINGS.contactDetails,
    bankDetails: Array.isArray(data.bankDetails) ? data.bankDetails : DEFAULT_STORE_SETTINGS.bankDetails,
    paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : DEFAULT_STORE_SETTINGS.paymentMethods,
    footerDescription: data.footerDescription ?? DEFAULT_STORE_SETTINGS.footerDescription,
    servicesPage: data.servicesPage ?? DEFAULT_STORE_SETTINGS.servicesPage,
  };
}

export async function getStoreSettings(): Promise<StoreSettings> {
  if (!db) return DEFAULT_STORE_SETTINGS;

  try {
    const record = await db.storeSetting.findUnique({
      where: { id: "default" },
    });

    if (!record?.data) return DEFAULT_STORE_SETTINGS;

    const parsed = JSON.parse(record.data) as Partial<StoreSettings>;
    return normalizeStoreSettings(parsed);
  } catch (error) {
    console.error("[StoreSettings] Failed to fetch:", error);
    return DEFAULT_STORE_SETTINGS;
  }
}

/**
 * Save store settings to the database.
 * Upserts the "default" record.
 */
export async function saveStoreSettings(
  data: Partial<StoreSettings>,
): Promise<StoreSettings> {
  if (!db) {
    throw new Error("Database is not available.");
  }

  try {
    // Merge with existing settings
    const existing = await getStoreSettings();
    const merged = normalizeStoreSettings({ ...existing, ...data });

    await db.storeSetting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        data: JSON.stringify(merged),
      },
      update: {
        data: JSON.stringify(merged),
      },
    });

    return merged;
  } catch (error) {
    console.error("[StoreSettings] Failed to save:", error);
    throw error;
  }
}
