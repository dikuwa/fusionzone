/**
 * API routes for Services management.
 * GET  /api/services - Fetch all services
 * POST /api/services - Create, update, delete or reorder services
 */

import { NextRequest, NextResponse } from "next/server";
import { getServices, createService, updateService, deleteService, reorderServices } from "@/lib/services";
import { authorizePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/permissions";
import { z } from "zod";

const serviceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  icon: z.string().min(1).max(50),
  imageUrl: z.string().nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  isEnabled: z.boolean().optional(),
  features: z.array(z.string().min(1)).optional(),
  primaryCtaLabel: z.string().max(100).optional(),
  primaryCtaType: z.string().max(50).optional(),
  primaryCtaDest: z.string().nullable().optional(),
  primaryCtaVisible: z.boolean().optional(),
  secondaryCtaLabel: z.string().max(100).optional(),
  secondaryCtaType: z.string().max(50).optional(),
  secondaryCtaDest: z.string().nullable().optional(),
  secondaryCtaVisible: z.boolean().optional(),
});

export async function GET() {
  try {
    const services = await getServices();
    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error("[Services API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizePermission(Permissions.SETTINGS_UPDATE);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create": {
        const parsed = serviceSchema.safeParse(body.data);
        if (!parsed.success) {
          return NextResponse.json(
            { success: false, error: "Invalid service data", details: parsed.error.flatten() },
            { status: 400 },
          );
        }
        const service = await createService(parsed.data as any);
        if (!service) throw new Error("Failed to create service");
        return NextResponse.json({ success: true, service });
      }

      case "update": {
        if (!body.id) {
          return NextResponse.json(
            { success: false, error: "Service ID is required" },
            { status: 400 },
          );
        }
        const parsed = serviceSchema.partial().safeParse(body.data);
        if (!parsed.success) {
          return NextResponse.json(
            { success: false, error: "Invalid service data", details: parsed.error.flatten() },
            { status: 400 },
          );
        }
        const service = await updateService(body.id, parsed.data);
        if (!service) throw new Error("Failed to update service");
        return NextResponse.json({ success: true, service });
      }

      case "delete": {
        if (!body.id) {
          return NextResponse.json(
            { success: false, error: "Service ID is required" },
            { status: 400 },
          );
        }
        const deleted = await deleteService(body.id);
        if (!deleted) throw new Error("Failed to delete service");
        return NextResponse.json({ success: true });
      }

      case "reorder": {
        if (!Array.isArray(body.orderedIds)) {
          return NextResponse.json(
            { success: false, error: "orderedIds array is required" },
            { status: 400 },
          );
        }
        const reordered = await reorderServices(body.orderedIds);
        if (!reordered) throw new Error("Failed to reorder services");
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("[Services API] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 },
    );
  }
}
