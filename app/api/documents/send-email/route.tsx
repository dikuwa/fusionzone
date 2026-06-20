/**
 * POST /api/documents/send-email
 *
 * Generates a PDF receipt/quotation and sends it via email with the PDF attached.
 *
 * Body:
 *   documentType: "receipt" | "quotation"
 *   recipientEmail: string
 *   recipientName: string (optional)
 *   documentNumber: string
 *   orderSnapshot: ReceiptPDFProps-compatible snapshot (for receipts)
 *   quotationNumber: string (for quotations)
 *
 * Returns: { success: true } or { success: false, error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { sendEmailWithAttachment } from "@/lib/email";
import { getStoreSettings } from "@/lib/store-settings";
import { ReceiptPDF, type ReceiptPDFProps } from "@/components/receipts/receipt-pdf";
import { QuotationPDF, type QuotationPDFProps } from "@/components/receipts/quotation-pdf";

const requestSchema = z.object({
  documentType: z.enum(["receipt", "quotation"]),
  recipientEmail: z.string().email().min(1),
  recipientName: z.string().optional(),
  documentNumber: z.string().min(1),
  subject: z.string().optional(),
  messageBody: z.string().optional(),
  shareUrl: z.string().optional(),
  // Receipt-specific: order data snapshot
  orderSnapshot: z.object({
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
  }).optional(),
  // Quotation-specific: data snapshot
  quotationSnapshot: z.object({
    quotationNumber: z.string().min(1),
    customerName: z.string().min(1),
    customerPhone: z.string().min(1),
    customerEmail: z.string().optional(),
    items: z.array(z.object({
      name: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
      sku: z.string().optional(),
    })).min(1),
    subtotalCents: z.number().int().nonnegative(),
    notes: z.string().optional(),
    status: z.string().min(1),
    createdAt: z.string().min(1),
  }).optional(),
});

function loadPdfLogo(): string | null {
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "fusionzone-logo-pdf.png");
    return `data:image/png;base64,${readFileSync(logoPath).toString("base64")}`;
  } catch {
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

async function generateQuotationPdfBuffer(quotationSnapshot: z.infer<typeof requestSchema>["quotationSnapshot"]): Promise<Buffer> {
  if (!quotationSnapshot) throw new Error("quotationSnapshot is required for quotation PDF");
  const date = new Date(quotationSnapshot.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const storeSettings = await getStoreSettings();

  const quotationProps: QuotationPDFProps = {
    quotationNumber: quotationSnapshot.quotationNumber,
    date,
    customerName: quotationSnapshot.customerName,
    customerPhone: quotationSnapshot.customerPhone,
    customerEmail: quotationSnapshot.customerEmail,
    items: quotationSnapshot.items,
    subtotal: quotationSnapshot.subtotalCents,
    notes: quotationSnapshot.notes,
    status: quotationSnapshot.status,
    storeName: storeSettings.storeName,
    storeLocation: storeSettings.address,
    storePhone: storeSettings.phone,
    storeEmail: storeSettings.email,
  };

  let pdfBuffer: Buffer;
  try {
    const stream = await renderToStream(<QuotationPDF {...quotationProps} logoSrc={loadPdfLogo()} />);
    pdfBuffer = await streamToBuffer(stream);
  } catch {
    const stream = await renderToStream(<QuotationPDF {...quotationProps} logoSrc={null} />);
    pdfBuffer = await streamToBuffer(stream);
  }
  return pdfBuffer;
}

async function generateReceiptPdfBuffer(orderSnapshot: z.infer<typeof requestSchema>["orderSnapshot"]): Promise<Buffer> {
  if (!orderSnapshot) throw new Error("orderSnapshot is required for receipt PDF");
  const receiptNumber = `RCP-${orderSnapshot.orderNumber.replace("DT-", "")}`;
  const date = new Date(orderSnapshot.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const storeSettings = await getStoreSettings();

  const receiptProps: ReceiptPDFProps = {
    receiptNumber,
    orderNumber: orderSnapshot.orderNumber,
    date,
    customerName: orderSnapshot.customerName,
    customerPhone: orderSnapshot.customerPhone,
    items: orderSnapshot.items,
    subtotal: orderSnapshot.subtotalCents,
    paymentStatus: orderSnapshot.paymentStatus,
    totalPaidCents: orderSnapshot.totalPaidCents,
    balanceDueCents: orderSnapshot.balanceDueCents,
    fulfillmentMethod: orderSnapshot.fulfillmentMethod,
    courierFeeCents: orderSnapshot.courierFeeCents,
    shipping: orderSnapshot.shipping,
    storeLocation: storeSettings.address,
    storePhone: storeSettings.phone,
    storeName: storeSettings.storeName,
  };

  let pdfBuffer: Buffer;
  try {
    const stream = await renderToStream(<ReceiptPDF {...receiptProps} logoSrc={loadPdfLogo()} />);
    pdfBuffer = await streamToBuffer(stream);
  } catch {
    const stream = await renderToStream(<ReceiptPDF {...receiptProps} logoSrc={null} />);
    pdfBuffer = await streamToBuffer(stream);
  }
  return pdfBuffer;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request: " + parsed.error.message },
        { status: 400 },
      );
    }

    const { documentType, recipientEmail, recipientName, documentNumber, subject, messageBody, shareUrl, orderSnapshot, quotationSnapshot } = parsed.data;
    const pdfFilename = documentType === "receipt" ? `Receipt-${documentNumber}.pdf` : `Quotation-${documentNumber}.pdf`;

    // Generate PDF buffer
    let pdfBuffer: Buffer;
    try {
      if (documentType === "receipt") {
        pdfBuffer = await generateReceiptPdfBuffer(orderSnapshot);
      } else {
        pdfBuffer = await generateQuotationPdfBuffer(quotationSnapshot);
      }
    } catch (error) {
      console.error("[SendEmail] PDF generation failed:", error);
      return NextResponse.json(
        { success: false, error: "Failed to generate PDF" },
        { status: 500 },
      );
    }

    // Convert to base64 for email attachment
    const pdfBase64 = pdfBuffer.toString("base64");

    // Build email HTML with optional share link
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject || `${documentType === "receipt" ? "Receipt" : "Quotation"} ${documentNumber}`}</title>
  <style>
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #111; background: #f7f7f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #0d41e2; padding: 40px 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .content h2 { color: #111; font-size: 20px; margin-top: 0; }
    .link-box { background: #f7f7f7; padding: 16px; border-radius: 8px; margin: 20px 0; word-break: break-all; }
    .footer { background: #111; color: #9a9a9a; padding: 30px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FusionZone</h1>
    </div>
    <div class="content">
      ${recipientName ? `<h2>Hi ${recipientName},</h2>` : ""}
      <p>Please find your ${documentType === "receipt" ? "receipt" : "quotation"} attached to this email.</p>
      ${messageBody ? `<p>${messageBody}</p>` : ""}
      ${shareUrl ? `
      <div class="link-box">
        <p style="margin: 0 0 8px; font-size: 13px; color: #6f6f6f;">You can also view it online:</p>
        <a href="${shareUrl}" style="color: #0d41e2; font-size: 14px;">${shareUrl}</a>
      </div>
      ` : ""}
      <p style="color: #6f6f6f; font-size: 13px;">Thank you for choosing FusionZone!</p>
    </div>
    <div class="footer">
      <p>FusionZone | Namibia</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
${recipientName ? `Hi ${recipientName},` : ""}

Please find your ${documentType === "receipt" ? "receipt" : "quotation"} attached.

${messageBody || ""}
${shareUrl ? `\nView online: ${shareUrl}` : ""}

Thank you for choosing FusionZone!
    `.trim();

    // Send email with PDF attachment via Resend
    await sendEmailWithAttachment({
      to: recipientEmail,
      subject: subject || `${documentType === "receipt" ? "Receipt" : "Quotation"} ${documentNumber}`,
      html,
      text,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBase64,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SendEmail] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    );
  }
}
