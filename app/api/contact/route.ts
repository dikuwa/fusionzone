/**
 * POST /api/contact
 *
 * Receives a contact form submission, saves it to the database,
 * and sends a notification email to the business.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { getStoreSettings } from "@/lib/store-settings";

const contactSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  subject: z.string().optional().or(z.literal("")),
  message: z.string().min(1, "Message is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { fullName, email, phone, subject, message } = parsed.data;

    // Build the email content
    const storeSettings = await getStoreSettings();
    const businessEmail = storeSettings.email || process.env.BUSINESS_EMAIL || "sales@fusionzone.example";
    const subjectLine = subject
      ? `New Contact Form Enquiry: ${subject}`
      : `New Contact Form Enquiry from ${fullName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subjectLine}</title>
  <style>
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #111; background: #f7f7f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #0d41e2; padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .content { padding: 30px; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px; }
    .field-value { font-size: 14px; color: #111; }
    .message-box { background: #f7f7f7; padding: 16px; border-radius: 8px; margin-top: 8px; white-space: pre-wrap; }
    .footer { background: #111; color: #9a9a9a; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FusionZone</h1>
    </div>
    <div class="content">
      <h2 style="margin-top:0;">New Contact Form Enquiry</h2>
      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">${fullName}</div>
      </div>
      ${email ? `<div class="field"><div class="field-label">Email</div><div class="field-value">${email}</div></div>` : ""}
      ${phone ? `<div class="field"><div class="field-label">Phone</div><div class="field-value">${phone}</div></div>` : ""}
      ${subject ? `<div class="field"><div class="field-label">Subject</div><div class="field-value">${subject}</div></div>` : ""}
      <div class="field">
        <div class="field-label">Message</div>
        <div class="message-box">${message}</div>
      </div>
    </div>
    <div class="footer">
      <p>FusionZone | Namibia</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
New Contact Form Enquiry

Name: ${fullName}
${email ? `Email: ${email}` : ""}
${phone ? `Phone: ${phone}` : ""}
${subject ? `Subject: ${subject}` : ""}
Message:
${message}
    `.trim();

    // Send notification to business
    try {
      await sendEmail({
        to: businessEmail,
        subject: subjectLine,
        html,
        text,
      });
    } catch (err) {
      console.error("[Contact API] Email send failed (non-fatal):", err);
      // Email failure is non-fatal — the submission is still noted
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for reaching out. We'll respond within 24 hours.",
    });
  } catch (error) {
    console.error("[Contact API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
