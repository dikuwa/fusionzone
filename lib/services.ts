/**
 * Server-side services helper.
 * Provides CRUD operations for Service records.
 */
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface ServiceRecord {
  id: string;
  title: string;
  description: string;
  icon: string;
  imageUrl: string | null;
  sortOrder: number;
  isEnabled: boolean;
  features: string[];
  primaryCtaLabel: string;
  primaryCtaType: string;
  primaryCtaDest: string | null;
  primaryCtaVisible: boolean;
  secondaryCtaLabel: string;
  secondaryCtaType: string;
  secondaryCtaDest: string | null;
  secondaryCtaVisible: boolean;
}

export const DEFAULT_SERVICES: Omit<ServiceRecord, "id">[] = [
  {
    title: "PC & Laptop Sales and Repairs",
    description:
      "Sales, diagnostics, upgrades and professional repairs for desktop computers and laptops.",
    icon: "Laptop",
    imageUrl: null,
    sortOrder: 0,
    isEnabled: true,
    features: [
      "New and pre-owned computers",
      "Laptop and desktop repairs",
      "Hardware diagnostics",
      "Component replacements",
      "Memory and storage upgrades",
      "General maintenance",
    ],
    primaryCtaLabel: "Enquire Now",
    primaryCtaType: "whatsapp",
    primaryCtaDest: null,
    primaryCtaVisible: true,
    secondaryCtaLabel: "Call Us",
    secondaryCtaType: "phone",
    secondaryCtaDest: null,
    secondaryCtaVisible: true,
  },
  {
    title: "Software Installations and Upgrades",
    description:
      "Professional software installation, operating-system setup and application upgrades for personal and business computers.",
    icon: "FileCode",
    imageUrl: null,
    sortOrder: 1,
    isEnabled: true,
    features: [
      "Operating-system installation",
      "Software configuration",
      "Application upgrades",
      "Driver installation",
      "System optimisation",
      "Licence setup assistance",
    ],
    primaryCtaLabel: "Enquire Now",
    primaryCtaType: "whatsapp",
    primaryCtaDest: null,
    primaryCtaVisible: true,
    secondaryCtaLabel: "Call Us",
    secondaryCtaType: "phone",
    secondaryCtaDest: null,
    secondaryCtaVisible: true,
  },
  {
    title: "Virus Removal and Data Recovery",
    description:
      "Malware removal, system cleanup and data-recovery assistance for damaged, infected or inaccessible devices.",
    icon: "Shield",
    imageUrl: null,
    sortOrder: 2,
    isEnabled: true,
    features: [
      "Virus and malware removal",
      "System security checks",
      "Data recovery",
      "File backup assistance",
      "Corrupted-system recovery",
      "Security-software setup",
    ],
    primaryCtaLabel: "Enquire Now",
    primaryCtaType: "whatsapp",
    primaryCtaDest: null,
    primaryCtaVisible: true,
    secondaryCtaLabel: "Call Us",
    secondaryCtaType: "phone",
    secondaryCtaDest: null,
    secondaryCtaVisible: true,
  },
  {
    title: "Network Installations and Configurations",
    description:
      "Reliable wired and wireless network installation, configuration and troubleshooting for homes and businesses.",
    icon: "Network",
    imageUrl: null,
    sortOrder: 3,
    isEnabled: true,
    features: [
      "Wi-Fi installation",
      "Router configuration",
      "Network cabling",
      "Access-point setup",
      "Network troubleshooting",
      "Business network configuration",
    ],
    primaryCtaLabel: "Enquire Now",
    primaryCtaType: "whatsapp",
    primaryCtaDest: null,
    primaryCtaVisible: true,
    secondaryCtaLabel: "Call Us",
    secondaryCtaType: "phone",
    secondaryCtaDest: null,
    secondaryCtaVisible: true,
  },
  {
    title: "Point of Sale Systems",
    description:
      "Point of sale hardware and software solutions for retail, hospitality and service businesses.",
    icon: "ShoppingCart",
    imageUrl: null,
    sortOrder: 4,
    isEnabled: true,
    features: [
      "POS terminals",
      "Receipt printers",
      "Barcode scanners",
      "Cash drawers",
      "POS software installation",
      "Configuration and support",
    ],
    primaryCtaLabel: "Enquire Now",
    primaryCtaType: "whatsapp",
    primaryCtaDest: null,
    primaryCtaVisible: true,
    secondaryCtaLabel: "Call Us",
    secondaryCtaType: "phone",
    secondaryCtaDest: null,
    secondaryCtaVisible: true,
  },
  {
    title: "CCTV Camera Installations",
    description:
      "CCTV camera installation and configuration solutions for homes, shops and business premises.",
    icon: "Camera",
    imageUrl: null,
    sortOrder: 5,
    isEnabled: true,
    features: [
      "Indoor and outdoor cameras",
      "DVR and NVR systems",
      "Remote viewing setup",
      "Camera installation",
      "System configuration",
      "Maintenance and support",
    ],
    primaryCtaLabel: "Enquire Now",
    primaryCtaType: "whatsapp",
    primaryCtaDest: null,
    primaryCtaVisible: true,
    secondaryCtaLabel: "Call Us",
    secondaryCtaType: "phone",
    secondaryCtaDest: null,
    secondaryCtaVisible: true,
  },
];

export interface SupportCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  isEnabled: boolean;
  sortOrder: number;
}

export interface PreOwnedTechSection {
  isEnabled: boolean;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export interface ServicesPageSettings {
  header: {
    eyebrow: string;
    heading: string;
    description: string;
  };
  supportSectionHeading: string;
  supportSectionDescription: string;
  supportCards: SupportCard[];
  preOwnedTech: PreOwnedTechSection;
  bottomCta: {
    heading: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaType: string;
    primaryCtaDest: string | null;
    secondaryCtaLabel: string;
    secondaryCtaType: string;
    secondaryCtaDest: string | null;
  };
}

export const DEFAULT_SERVICES_PAGE_SETTINGS: ServicesPageSettings = {
  header: {
    eyebrow: "",
    heading: "Our Services",
    description:
      "Professional technology services throughout Namibia. Installation, setup, maintenance, and support for homes and businesses.",
  },
  supportSectionHeading: "Support beyond the main service",
  supportSectionDescription: "",
  supportCards: [
    {
      id: "sc1",
      title: "Product Installation",
      description:
        "Professional installation and setup for security, networking, POS, and technology products purchased from us.",
      icon: "Wrench",
      isEnabled: true,
      sortOrder: 0,
    },
    {
      id: "sc2",
      title: "Solution Consultation",
      description:
        "Practical guidance to help you choose the right technology, security, networking, or POS solution for your home or business.",
      icon: "MessageCircle",
      isEnabled: true,
      sortOrder: 1,
    },
    {
      id: "sc3",
      title: "Guided DIY Support",
      description:
        "Remote guidance for customers who prefer to install, configure, or troubleshoot their systems with expert support.",
      icon: "Search",
      isEnabled: true,
      sortOrder: 2,
    },
  ],
  preOwnedTech: {
    isEnabled: true,
    title: "We Buy Selected Pre-Owned Technology",
    description:
      "Have a laptop, desktop computer or other technology device you no longer use? FusionZone buys selected pre-owned technology after inspection and condition checks.",
    icon: "Monitor",
    features: [
      "Pre-owned laptops",
      "Pre-owned desktop computers",
      "Selected electronic devices",
      "Computer accessories",
      "Devices in working condition",
      "Inspection before purchase",
      "Condition-based offers",
    ],
  },
  bottomCta: {
    heading: "Need a custom solution?",
    description:
      "Contact us to discuss your specific requirements. We provide free site assessments.",
    primaryCtaLabel: "Chat on WhatsApp",
    primaryCtaType: "whatsapp",
    primaryCtaDest: null,
    secondaryCtaLabel: "Send Enquiry",
    secondaryCtaType: "contact",
    secondaryCtaDest: null,
  },
};

/**
 * Normalize raw service data from the database into a ServiceRecord.
 */
function normalizeService(raw: any): ServiceRecord {
  const features = raw.features;
  const featuresArray = Array.isArray(features)
    ? features.filter((f: any): f is string => typeof f === "string")
    : [];
  return {
    id: raw.id,
    title: raw.title || "",
    description: raw.description || "",
    icon: raw.icon || "Wrench",
    imageUrl: raw.imageUrl || null,
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : 0,
    isEnabled: raw.isEnabled !== false,
    features: featuresArray,
    primaryCtaLabel: raw.primaryCtaLabel || "Enquire Now",
    primaryCtaType: raw.primaryCtaType || "whatsapp",
    primaryCtaDest: raw.primaryCtaDest || null,
    primaryCtaVisible: raw.primaryCtaVisible !== false,
    secondaryCtaLabel: raw.secondaryCtaLabel || "Call Us",
    secondaryCtaType: raw.secondaryCtaType || "phone",
    secondaryCtaDest: raw.secondaryCtaDest || null,
    secondaryCtaVisible: raw.secondaryCtaVisible !== false,
  };
}

// ============== SERVICE CRUD ==============

/**
 * Get all services, ordered by sortOrder.
 */
export async function getServices(): Promise<ServiceRecord[]> {
  if (!db) return [];

  try {
    const rows = await db.service.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(normalizeService);
  } catch (error) {
    console.error("[Services] Failed to fetch:", error);
    return [];
  }
}

/**
 * Get only enabled services (for public page).
 */
export async function getEnabledServices(): Promise<ServiceRecord[]> {
  const all = await getServices();
  return all.filter((s) => s.isEnabled);
}

/**
 * Create a new service.
 */
export async function createService(
  data: Omit<ServiceRecord, "id">,
): Promise<ServiceRecord | null> {
  if (!db) return null;

  try {
    const created = await db.service.create({
      data: {
        title: data.title,
        description: data.description,
        icon: data.icon,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder,
        isEnabled: data.isEnabled,
        features: data.features as Prisma.InputJsonValue,
        primaryCtaLabel: data.primaryCtaLabel,
        primaryCtaType: data.primaryCtaType,
        primaryCtaDest: data.primaryCtaDest,
        primaryCtaVisible: data.primaryCtaVisible,
        secondaryCtaLabel: data.secondaryCtaLabel,
        secondaryCtaType: data.secondaryCtaType,
        secondaryCtaDest: data.secondaryCtaDest,
        secondaryCtaVisible: data.secondaryCtaVisible,
      },
    });
    return normalizeService(created);
  } catch (error) {
    console.error("[Services] Failed to create:", error);
    return null;
  }
}

/**
 * Update an existing service.
 */
export async function updateService(
  id: string,
  data: Partial<ServiceRecord>,
): Promise<ServiceRecord | null> {
  if (!db) return null;

  try {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
    if (data.features !== undefined) updateData.features = data.features as Prisma.InputJsonValue;
    if (data.primaryCtaLabel !== undefined) updateData.primaryCtaLabel = data.primaryCtaLabel;
    if (data.primaryCtaType !== undefined) updateData.primaryCtaType = data.primaryCtaType;
    if (data.primaryCtaDest !== undefined) updateData.primaryCtaDest = data.primaryCtaDest;
    if (data.primaryCtaVisible !== undefined) updateData.primaryCtaVisible = data.primaryCtaVisible;
    if (data.secondaryCtaLabel !== undefined) updateData.secondaryCtaLabel = data.secondaryCtaLabel;
    if (data.secondaryCtaType !== undefined) updateData.secondaryCtaType = data.secondaryCtaType;
    if (data.secondaryCtaDest !== undefined) updateData.secondaryCtaDest = data.secondaryCtaDest;
    if (data.secondaryCtaVisible !== undefined) updateData.secondaryCtaVisible = data.secondaryCtaVisible;

    const updated = await db.service.update({
      where: { id },
      data: updateData,
    });
    return normalizeService(updated);
  } catch (error) {
    console.error("[Services] Failed to update:", error);
    return null;
  }
}

/**
 * Delete a service.
 */
export async function deleteService(id: string): Promise<boolean> {
  if (!db) return false;

  try {
    await db.service.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error("[Services] Failed to delete:", error);
    return false;
  }
}

/**
 * Reorder services (batch update sortOrder).
 */
export async function reorderServices(
  orderedIds: string[],
): Promise<boolean> {
  if (!db) return false;
  const client = db!;

  try {
    await client.$transaction(
      orderedIds.map((id, index) =>
        client.service.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return true;
  } catch (error) {
    console.error("[Services] Failed to reorder:", error);
    return false;
  }
}

/**
 * Seed default services into the database if none exist.
 */
export async function seedDefaultServices(): Promise<void> {
  if (!db) return;
  const client = db!;
  const count = await client.service.count();
  if (count > 0) return;

  for (let i = 0; i < DEFAULT_SERVICES.length; i++) {
    const s = DEFAULT_SERVICES[i];
    await client.service.create({
      data: {
        title: s.title,
        description: s.description,
        icon: s.icon,
        imageUrl: s.imageUrl,
        sortOrder: s.sortOrder,
        isEnabled: s.isEnabled,
        features: s.features as Prisma.InputJsonValue,
        primaryCtaLabel: s.primaryCtaLabel,
        primaryCtaType: s.primaryCtaType,
        primaryCtaDest: s.primaryCtaDest,
        primaryCtaVisible: s.primaryCtaVisible,
        secondaryCtaLabel: s.secondaryCtaLabel,
        secondaryCtaType: s.secondaryCtaType,
        secondaryCtaDest: s.secondaryCtaDest,
        secondaryCtaVisible: s.secondaryCtaVisible,
      },
    });
  }
  console.log("[Services] Seeded default services.");
}
