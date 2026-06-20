/**
 * Shared PDF generation utilities for document sharing.
 *
 * Extracts the common PDF generation logic (logo loading, stream-to-buffer,
 * ReceiptPDF rendering with fallback) so that it's defined once and reused
 * by the dashboard download, API share, and public /d/ routes.
 */
import { renderToStream } from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ReceiptPDF } from "@/components/receipts/receipt-pdf";
import type { DocumentDataSnapshot } from "@/lib/document-tokens";

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------

let cachedLogo: string | null | undefined = undefined;

function loadPdfLogo(): string | null {
  if (cachedLogo !== undefined) return cachedLogo;
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "fusionzone-logo-pdf.png");
    cachedLogo = `data:image/png;base64,${readFileSync(logoPath).toString("base64")}`;
  } catch {
    cachedLogo = null;
  }
  return cachedLogo;
}

// ---------------------------------------------------------------------------
// Stream helper
// ---------------------------------------------------------------------------

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
// Public API
// ---------------------------------------------------------------------------

export interface PdfInput {
  documentNumber: string;
  referenceId: string;
  snapshot: DocumentDataSnapshot;
}

export interface PdfResult {
  buffer: Buffer;
  filename: string;
}

/**
 * Generate a document PDF from a data snapshot.
 *
 * Uses the same ReceiptPDF component as the dashboard's Print Preview
 * and direct Download. Retries without the logo if the first attempt fails.
 */
export async function generateDocumentPdf(input: PdfInput): Promise<PdfResult> {
  const { documentNumber, referenceId, snapshot } = input;
  const date = snapshot.createdAt
    ? new Date(snapshot.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const props = {
    receiptNumber: documentNumber,
    orderNumber: snapshot.orderNumber || referenceId,
    date,
    customerName: snapshot.customerName || "Customer",
    customerPhone: snapshot.customerPhone || "",
    items: snapshot.items || [],
    subtotal: snapshot.subtotalCents || 0,
    paymentStatus: snapshot.paymentStatus || "PaidInFull",
    totalPaidCents: snapshot.totalPaidCents || 0,
    balanceDueCents: snapshot.balanceDueCents ?? snapshot.subtotalCents ?? 0,
    fulfillmentMethod: snapshot.fulfillmentMethod as "collection" | "courier" | undefined,
    courierFeeCents: snapshot.courierFeeCents,
    shipping: snapshot.shipping,
  };

  let pdfBuffer: Buffer;
  try {
    const stream = await renderToStream(<ReceiptPDF {...props} logoSrc={loadPdfLogo()} />);
    pdfBuffer = await streamToBuffer(stream);
  } catch {
    // Retry without logo
    const stream = await renderToStream(<ReceiptPDF {...props} logoSrc={null} />);
    pdfBuffer = await streamToBuffer(stream);
  }

  const filename = `${documentNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

  return { buffer: pdfBuffer, filename };
}
