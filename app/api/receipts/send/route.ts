/**
 * API route to send a receipt via email with PDF attachment.
 * POST /api/receipts/send
 * Body: { orderNumber, customerEmail, customerName }
 */
import { NextRequest, NextResponse } from "next/server";
import { ReceiptEmail } from "@/components/emails/receipt-email";
import { sendEmailWithAttachment } from "@/lib/email";
import { formatCents } from "@/lib/dashboard-data";
import { useDashboardStore } from "@/lib/store/dashboard";
import { getOrderByNumber } from "@/lib/order-store";
import { render } from "@react-email/components";
import { authorizePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/permissions";
import { generateReceiptDocument } from "@/lib/document-service";

export async function POST(request: NextRequest) {
  const { error } = await authorizePermission(Permissions.DOCUMENTS_SEND);
  if (error) return error;

  try {
    const body = await request.json();
    const { orderNumber, customerEmail, customerName } = body;

    if (!orderNumber || !customerEmail) {
      return NextResponse.json(
        { error: "orderNumber and customerEmail are required" },
        { status: 400 },
      );
    }

    // Generate PDF and get public URL
    const docResult = await generateReceiptDocument(orderNumber);
    if (!docResult) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { buffer, filename, publicUrl, documentNumber } = docResult;

    // Create a short branded link for the email body
    let shortUrl = publicUrl;
    try {
      const { createShortLink } = await import("@/lib/document-share");
      const linkResult = await createShortLink(
        "receipt",
        orderNumber,
        documentNumber,
      );
      shortUrl = linkResult.url;
    } catch (linkError) {
      console.warn("[Receipt Send] Short link creation failed, using long URL:", linkError);
    }

    // Look up order to get total for email
    const stored = getOrderByNumber(orderNumber);
    const { orders } = useDashboardStore.getState();
    const order = stored
      ? { subtotalCents: stored.subtotalCents }
      : orders.find((o) => o.orderNumber === orderNumber);

    const totalAmount = formatCents(order?.subtotalCents || 0);

    // Render the React Email template to HTML
    const html = await render(
      ReceiptEmail({
        customerName: customerName || "Customer",
        orderNumber,
        receiptNumber: documentNumber,
        totalAmount,
        publicUrl: shortUrl,
      }),
    );

    // Send via Resend with PDF attachment
    const result = await sendEmailWithAttachment({
      to: customerEmail,
      subject: `Receipt ${documentNumber} — FusionZone`,
      html,
      attachments: [
        {
          filename,
          content: buffer.toString("base64"),
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ success: true, publicUrl });
  } catch (error) {
    console.error("Receipt send error:", error);
    return NextResponse.json(
      { error: "Failed to send receipt" },
      { status: 500 },
    );
  }
}
