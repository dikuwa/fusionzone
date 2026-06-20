/**
 * GET /api/documents/share/[token]
 *
 * Public share endpoint that resolves a signed document token and returns
 * the document as a PDF.
 *
 * - Works without authentication (intended for customer sharing)
 * - Uses the same {@link ReceiptPDF} component used by Print Preview
 *   and direct Download PDF
 * - Uses data from the signed token snapshot when available, falling back
 *   to the in-memory dashboard store
 * - Returns Content-Type: application/pdf
 * - Supports ?download=1 to force download (Content-Disposition: attachment)
 * - Never redirects, never returns HTML (except on error)
 */
import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ReceiptPDF } from "@/components/receipts/receipt-pdf";
import { verifyDocumentToken, type DocumentType } from "@/lib/document-tokens";
import { useDashboardStore } from "@/lib/store/dashboard";
import { getOrderByNumber } from "@/lib/order-store";
import { computePaymentFields } from "@/lib/dashboard-data";
import { getAppUrl } from "@/lib/app-url";

// ---------------------------------------------------------------------------
// Logo helper (reused from receipt PDF)
// ---------------------------------------------------------------------------

function loadPdfLogo(): string | null {
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "fusionzone-logo-pdf.png");
    return `data:image/png;base64,${readFileSync(logoPath).toString("base64")}`;
  } catch {
    return null;
  }
}

async function streamToBuffer(stream: Awaited<ReturnType<typeof renderToStream>>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return Buffer.concat(chunks);
}

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

interface ResolvedDocument {
  documentNumber: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number; sku?: string }>;
  subtotalCents: number;
  paymentStatus: string;
  totalPaidCents: number;
  balanceDueCents: number;
  createdAt: string;
  fulfillmentMethod?: "collection" | "courier";
  courierFeeCents?: number;
  shipping?: {
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    deliveryNotes?: string;
  };
}

/**
 * Resolve document data — first from the token snapshot, then from the
 * dashboard/order in-memory stores.
 */
function resolveDocument(
  type: DocumentType,
  referenceId: string,
  snapshot?: any,
): ResolvedDocument | null {
  // 1. Try the token snapshot (always available, survives restarts)
  if (snapshot) {
    return {
      documentNumber: snapshot.documentNumber || referenceId,
      orderNumber: snapshot.orderNumber || referenceId,
      customerName: snapshot.customerName || "Customer",
      customerPhone: snapshot.customerPhone || "",
      items: snapshot.items || [],
      subtotalCents: snapshot.subtotalCents || 0,
      paymentStatus: snapshot.paymentStatus || "PaidInFull",
      totalPaidCents: snapshot.totalPaidCents || 0,
      balanceDueCents: snapshot.balanceDueCents ?? snapshot.subtotalCents ?? 0,
      createdAt: snapshot.createdAt || new Date().toISOString(),
      fulfillmentMethod: snapshot.fulfillmentMethod,
      courierFeeCents: snapshot.courierFeeCents,
      shipping: snapshot.shipping,
    };
  }

  // 2. Try the in-memory dashboard store
  if (type === "receipt" || type === "invoice") {
    const { orders, payments } = useDashboardStore.getState();
    const order =
      orders.find((o) => o.id === referenceId || o.orderNumber === referenceId) ||
      getOrderByNumber(referenceId);

    if (order) {
      const orderPayments = payments.filter((p) => p.orderNumber === (order as any).orderNumber);
      const { totalPaidCents, balanceDueCents } = computePaymentFields(
        (order as any).subtotalCents || order.subtotalCents,
        (order as any).paymentStatus || order.paymentStatus,
        orderPayments,
      );

      const items = (order as any).items?.length
        ? (order as any).items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents || item.priceCents,
            total: (item.unitPriceCents || item.priceCents) * item.quantity,
            sku: item.sku,
          }))
        : [];

      return {
        documentNumber: `RCP-${(order as any).orderNumber?.replace("DT-", "") || referenceId}`,
        orderNumber: (order as any).orderNumber || referenceId,
        customerName: (order as any).customerName || order.customerName,
        customerPhone: (order as any).customerPhone || order.customerPhone,
        items,
        subtotalCents: (order as any).subtotalCents || order.subtotalCents,
        paymentStatus: (order as any).paymentStatus || order.paymentStatus,
        totalPaidCents,
        balanceDueCents,
        createdAt: (order as any).createdAt || order.createdAt,
        fulfillmentMethod: (order as any).fulfillmentMethod,
        courierFeeCents: (order as any).courierFeeCents,
        shipping: (order as any).shipping,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const isDownload = request.nextUrl.searchParams.get("download") === "1";

    // Validate that the production URL is configured (logs a warning if missing)
    getAppUrl();

    // Verify the signed token
    const payload = verifyDocumentToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          error:
            "This document link is invalid or has expired. Please request a new link from the sender.",
        },
        { status: 404 },
      );
    }

    // Resolve document data
    const doc = resolveDocument(payload.type, payload.referenceId, payload.data);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Generate PDF using the same ReceiptPDF component used by Print Preview
    const receiptNumber = doc.documentNumber;
    const date = new Date(doc.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const logoSrc = loadPdfLogo();

    let pdfBuffer: Buffer;
    try {
      const stream = await renderToStream(
        <ReceiptPDF
          receiptNumber={receiptNumber}
          orderNumber={doc.orderNumber}
          date={date}
          customerName={doc.customerName}
          customerPhone={doc.customerPhone}
          items={doc.items}
          subtotal={doc.subtotalCents}
          paymentStatus={doc.paymentStatus}
          totalPaidCents={doc.totalPaidCents}
          balanceDueCents={doc.balanceDueCents}
          fulfillmentMethod={doc.fulfillmentMethod}
          courierFeeCents={doc.courierFeeCents}
          shipping={doc.shipping}
          logoSrc={logoSrc}
        />,
      );
      pdfBuffer = await streamToBuffer(stream);
    } catch (error) {
      console.error("[PDF Share] Generation failed:", error);
      // Retry without logo
      const stream = await renderToStream(
        <ReceiptPDF
          receiptNumber={receiptNumber}
          orderNumber={doc.orderNumber}
          date={date}
          customerName={doc.customerName}
          customerPhone={doc.customerPhone}
          items={doc.items}
          subtotal={doc.subtotalCents}
          paymentStatus={doc.paymentStatus}
          totalPaidCents={doc.totalPaidCents}
          balanceDueCents={doc.balanceDueCents}
          fulfillmentMethod={doc.fulfillmentMethod}
          courierFeeCents={doc.courierFeeCents}
          shipping={doc.shipping}
          logoSrc={null}
        />,
      );
      pdfBuffer = await streamToBuffer(stream);
    }

    const filename = `${receiptNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    const disposition = isDownload ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[PDF Share] Error:", error);
    return NextResponse.json(
      { error: "Could not generate the PDF. Please try again." },
      { status: 500 },
    );
  }
}
