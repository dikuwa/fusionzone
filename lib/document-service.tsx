/**
 * Shared document service for generating PDFs and creating shareable links.
 * Used by receipts, invoices, and quotations.
 */

import { renderToStream } from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ReceiptPDF, type ReceiptPDFProps } from "@/components/receipts/receipt-pdf";
import { QuotationPDF, type QuotationPDFProps } from "@/components/receipts/quotation-pdf";
import { useDashboardStore } from "@/lib/store/dashboard";
import { getOrderByNumber } from "@/lib/order-store";
import { computePaymentFields } from "@/lib/dashboard-data";
import { getStoreSettings } from "@/lib/store-settings";
import { createDocumentReference } from "@/lib/document-reference";
import { generateDocumentToken, getPublicDocumentUrl, type DocumentType } from "./document-tokens";

// Load PDF logo once
function loadPdfLogo(): string | null {
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "fusionzone-logo-pdf.png");
    return `data:image/png;base64,${readFileSync(logoPath).toString("base64")}`;
  } catch (error) {
    console.warn("[PDF] Logo unavailable; using text branding", error);
    return null;
  }
}

const PDF_LOGO = loadPdfLogo();

// Convert React PDF stream to Buffer
async function streamToBuffer(stream: Awaited<ReturnType<typeof renderToStream>>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return Buffer.concat(chunks);
}

// Find order with payment data
function findOrderWithPayments(orderIdOrNumber: string) {
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

  // Try in-memory store
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

export interface DocumentResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
  documentNumber: string;
  publicUrl: string;
  token: string;
}

/**
 * Generate a receipt PDF and create a shareable token.
 * Returns the PDF buffer, filename, and public URL.
 */
export async function generateReceiptDocument(orderId: string): Promise<DocumentResult | null> {
  const order = findOrderWithPayments(orderId);
  if (!order) return null;

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

  // Fetch store settings for PDF branding
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
    storeLocation: storeSettings.address,
    storePhone: storeSettings.phone,
    storeName: storeSettings.storeName,
  };

  // Generate PDF
  let pdfBuffer: Buffer;
  try {
    const stream = await renderToStream(<ReceiptPDF {...receiptProps} logoSrc={PDF_LOGO} />);
    pdfBuffer = await streamToBuffer(stream);
  } catch (error) {
    console.error("[PDF] Receipt generation failed:", error);
    // Retry without logo
    const stream = await renderToStream(<ReceiptPDF {...receiptProps} logoSrc={null} />);
    pdfBuffer = await streamToBuffer(stream);
  }

  // Create shareable signed token with data snapshot
  const token = generateDocumentToken("receipt", order.orderNumber, receiptNumber, {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    items: order.items,
    subtotalCents: order.subtotalCents,
    paymentStatus: order.paymentStatus,
    totalPaidCents: order.totalPaidCents,
    balanceDueCents: order.balanceDueCents,
    createdAt: order.createdAt,
    fulfillmentMethod: order.fulfillmentMethod,
    courierFeeCents: order.courierFeeCents,
    shipping: order.shipping,
  });
  const publicUrl = getPublicDocumentUrl(token, "receipt");

  return {
    buffer: pdfBuffer,
    filename: `${receiptNumber}.pdf`,
    contentType: "application/pdf",
    documentNumber: receiptNumber,
    publicUrl,
    token,
  };
}

/**
 * Generate a quotation PDF and create a shareable token.
 * Returns the PDF buffer, filename, and public URL.
 */
export async function generateQuotationDocument(quotationId: string): Promise<DocumentResult | null> {
  const { quotations } = useDashboardStore.getState();
  const quotation = quotations.find((q) => q.id === quotationId || q.quotationNumber === quotationId);
  
  if (!quotation) return null;

  const storeSettings = await getStoreSettings();
  const date = new Date(quotation.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const quotationProps: QuotationPDFProps = {
    quotationNumber: quotation.quotationNumber,
    date,
    customerName: quotation.customerName,
    customerPhone: quotation.customerPhone,
    items: quotation.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPriceCents,
      total: item.unitPriceCents * item.quantity,
      sku: item.sku,
    })),
    subtotal: quotation.subtotalCents,
    notes: quotation.notes,
    status: quotation.status,
    storeName: storeSettings.storeName,
    storeLocation: storeSettings.address,
    storePhone: storeSettings.phone,
    storeEmail: storeSettings.email,
  };

  let pdfBuffer: Buffer;
  try {
    const stream = await renderToStream(<QuotationPDF {...quotationProps} logoSrc={PDF_LOGO} />);
    pdfBuffer = await streamToBuffer(stream);
  } catch {
    const stream = await renderToStream(<QuotationPDF {...quotationProps} logoSrc={null} />);
    pdfBuffer = await streamToBuffer(stream);
  }

  const token = generateDocumentToken("quotation", quotation.id, quotation.quotationNumber);
  const publicUrl = getPublicDocumentUrl(token, "quotation");

  return {
    buffer: pdfBuffer,
    filename: `${quotation.quotationNumber}.pdf`,
    contentType: "application/pdf",
    documentNumber: quotation.quotationNumber,
    publicUrl,
    token,
  };
}

/**
 * Get an existing document's public URL or create a new one.
 */
export async function getOrCreateDocumentUrl(
  type: DocumentType,
  referenceId: string,
  documentNumber?: string,
): Promise<string> {
  // Check for existing tokens
  const { getTokensForReference } = await import("./document-tokens");
  const existingTokens = getTokensForReference(referenceId);
  const validToken = existingTokens.find((t) => t.type === type && (!t.expiresAt || new Date(t.expiresAt) > new Date()));
  
  if (validToken) {
    return getPublicDocumentUrl(validToken.token, type);
  }

  // Generate new token
  const token = generateDocumentToken(type, referenceId, documentNumber || referenceId);
  return getPublicDocumentUrl(token, type);
}
