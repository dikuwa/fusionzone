/**
 * API route to generate a PDF receipt for a given order.
 * 
 * POST /api/receipts/generate
 * Body: { orderId }
 * Returns: PDF file as downloadable response
 */
import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ReceiptPDF, type ReceiptPDFProps } from "@/components/receipts/receipt-pdf";

// Order data store (same in-memory store used by /api/orders)
// We import this to look up orders
import { getOrderByNumber } from "@/lib/order-store";
import { useDashboardStore } from "@/lib/store/dashboard";
import { addReceipt } from "@/lib/receipt-store";
import { uploadFile } from "@/lib/storage";
import { computePaymentFields } from "@/lib/dashboard-data";
import { authorizePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/permissions";
import { getStoreSettings } from "@/lib/store-settings";
import { createDocumentReference } from "@/lib/document-reference";

const orderSnapshotSchema = z.object({
  orderNumber: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    sku: z.string().optional(),
  })).min(1),
  subtotalCents: z.number().int().nonnegative(),
  paymentStatus: z.string().min(1),
  totalPaidCents: z.number().int().nonnegative(),
  balanceDueCents: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
  fulfillmentMethod: z.enum(["collection", "courier"]).optional(),
  courierFeeCents: z.number().int().nonnegative().optional(),
  shipping: z.object({
    recipientName: z.string(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    region: z.string(),
    deliveryNotes: z.string().optional(),
  }).optional(),
});

function loadPdfLogo(): string | null {
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "fusionzone-logo-pdf.png");
    return `data:image/png;base64,${readFileSync(logoPath).toString("base64")}`;
  } catch (error) {
    console.warn("[PDF] Receipt logo unavailable; using text branding", error);
    return null;
  }
}

async function streamToBuffer(stream: Awaited<ReturnType<typeof renderToStream>>) {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return Buffer.concat(chunks);
}

async function renderReceiptBuffer(props: ReceiptPDFProps, logoSrc: string | null) {
  const stream = await renderToStream(
    <ReceiptPDF {...props} logoSrc={logoSrc} />,
  );
  return streamToBuffer(stream);
}

// Helper to get a readable order from either the in-memory store or dashboard store
function findOrder(orderIdOrNumber: string) {
  // Try dashboard store first (has payments data)
  const { orders, payments } = useDashboardStore.getState();
  const order = orders.find((o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber);
  if (order) {
    const orderPayments = payments.filter((p) => p.orderNumber === order.orderNumber);
    const { totalPaidCents, balanceDueCents } = computePaymentFields(
      order.subtotalCents,
      order.paymentStatus,
      orderPayments,
      { fulfillmentMethod: order.fulfillmentMethod, courierFeeCents: order.courierFeeCents },
    );
    return {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items?.length
        ? order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents,
            total: item.unitPriceCents * item.quantity,
            sku: item.sku,
          }))
        : Array.from({ length: order.itemCount }, (_, i) => {
            const perItem = Math.round(order.subtotalCents / order.itemCount);
            return {
              name: `Product ${i + 1}`,
              quantity: 1,
              unitPrice: i === order.itemCount - 1
                ? order.subtotalCents - perItem * (order.itemCount - 1)
                : perItem,
              total: i === order.itemCount - 1
                ? order.subtotalCents - perItem * (order.itemCount - 1)
                : perItem,
            };
          }),
      subtotalCents: order.subtotalCents,
      paymentStatus: order.paymentStatus,
      totalPaidCents,
      balanceDueCents,
      createdAt: order.createdAt,
      fulfillmentMethod: order.fulfillmentMethod,
      courierFeeCents: order.courierFeeCents,
      shipping: order.shipping,
    };
  }

  // Try in-memory store (orders from the checkout flow)
  const stored = getOrderByNumber(orderIdOrNumber);
  if (stored) {
    return {
      orderNumber: stored.orderNumber,
      customerName: stored.customerName,
      customerPhone: stored.customerPhone,
      items: stored.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.priceCents,
        total: i.priceCents * i.quantity,
      })),
      subtotalCents: stored.subtotalCents,
      paymentStatus: stored.paymentStatus,
      totalPaidCents: 0,
      balanceDueCents: stored.subtotalCents,
      createdAt: stored.createdAt,
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  const { error: authorizationError } = await authorizePermission(Permissions.DOCUMENTS_CREATE);
  if (authorizationError) return authorizationError;

  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const snapshotResult = orderSnapshotSchema.safeParse(body.orderSnapshot);
    const order = findOrder(orderId) ?? (snapshotResult.success ? snapshotResult.data : null);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Generate receipt number
    const storeSettings = await getStoreSettings();
    const receiptNumber = createDocumentReference(
      storeSettings.receiptPrefix,
      "RCP",
      order.orderNumber,
      Date.now().toString(36).toUpperCase().slice(-4),
    );
    const date = new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const receiptProps: ReceiptPDFProps = {
      receiptNumber,
      orderNumber: order.orderNumber,
      date,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items,
      subtotal: order.subtotalCents,
      paymentStatus: order.paymentStatus,
      totalPaidCents: order.totalPaidCents,
      balanceDueCents: order.balanceDueCents,
      fulfillmentMethod: order.fulfillmentMethod,
      courierFeeCents: order.courierFeeCents,
      shipping: order.shipping,
    };

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await renderReceiptBuffer(receiptProps, loadPdfLogo());
    } catch (error) {
      console.error("[PDF] Receipt assets failed; retrying with text branding", error);
      pdfBuffer = await renderReceiptBuffer(receiptProps, null);
    }

    const isView = body.view === true || body.view === "true" || body.view === 1;

    // Store the receipt record (async upload to R2 if configured)
    let pdfUrl: string | undefined;
    try {
      const uploadResult = await uploadFile(
        pdfBuffer,
        `${receiptNumber}.pdf`,
        "application/pdf",
      );
      pdfUrl = uploadResult.url;
    } catch {}

    addReceipt({
      receiptNumber,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      pdfUrl,
      sentVia: "NotSent",
      issuedAt: new Date().toISOString(),
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": isView ? `inline; filename="${receiptNumber}.pdf"` : `attachment; filename="${receiptNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Receipt generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/receipts/generate?orderId=xxx — alias for POST for convenience
 * Supports ?view=1 to preview inline in browser instead of downloading.
 */
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");
  const view = request.nextUrl.searchParams.get("view");
  if (!orderId) {
    return NextResponse.json({ error: "orderId query param is required" }, { status: 400 });
  }
  return POST(
    new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify({ orderId, view: view === "1" || view === "true" }),
      headers: { "Content-Type": "application/json" },
    }),
  );
}
