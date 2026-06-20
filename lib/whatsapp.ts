/**
 * WhatsApp notification utility for FusionZone.
 * Sends messages via WhatsApp Business API / cloud API.
 * Falls back to console logging in development.
 */

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";
const BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE || "";

interface WhatsAppOptions {
  to: string; // Recipient phone number (without + prefix)
  template?: string;
  body: string;
}

/**
 * Send a WhatsApp message.
 * Falls back to console logging in development without credentials.
 */
export async function sendWhatsApp(options: WhatsAppOptions): Promise<void> {
  const { to, body } = options;

  // Log in development
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.log("\n========== WHATSAPP (Development Mode) ==========");
    console.log(`To: ${to}`);
    console.log(`Body: ${body}`);
    console.log("================================================\n");
    return;
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to.replace(/^\+/, ""),
          type: "text",
          text: { body },
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `WhatsApp API error: ${response.status} ${JSON.stringify(errorData)}`,
      );
    }

    console.log(`[WhatsApp] Sent to ${to}`);
  } catch (error) {
    console.error("[WhatsApp] Failed to send:", error);
    // Don't throw — WhatsApp is best-effort delivery
  }
}

/**
 * Send a password reset notification via WhatsApp.
 */
export async function sendPasswordResetWhatsApp(
  phone: string,
  name: string,
  token: string,
  storeName?: string,
): Promise<void> {
  const { getAppUrl } = await import("./app-url");
  const appUrl = getAppUrl();
  const resetUrl = `${appUrl}/admin/reset-password?token=${token}`;
  const company = storeName || "FusionZone";

  const message = [
    `🔐 *${company} — Password Reset*`,
    ``,
    `Hi ${name},`,
    ``,
    `A password reset was requested for your account.`,
    ``,
    `Click the link to reset:`,
    `${resetUrl}`,
    ``,
    `This link expires in 1 hour.`,
    ``,
    `If you didn't request this, please ignore this message.`,
    ``,
    `— ${company}`,
  ].join("\n");

  await sendWhatsApp({ to: phone, body: message });
}

/**
 * Send an account invitation via WhatsApp.
 */
export async function sendInvitationWhatsApp(
  phone: string,
  name: string,
  shortCode: string,
  role: string,
  inviterName: string,
  storeName?: string,
): Promise<void> {
  const { getAppUrl } = await import("./app-url");
  const appUrl = getAppUrl();
  const acceptUrl = `${appUrl}/invite/${shortCode}`;
  const roleDisplay = role.charAt(0) + role.slice(1).toLowerCase();
  const company = storeName || "FusionZone";

  const message = [
    `🎉 *${company} — You're Invited!*`,
    ``,
    `Hi ${name},`,
    ``,
    `${inviterName} has invited you to join ${company} as a *${roleDisplay}*.`,
    ``,
    `Click to accept:`,
    `${acceptUrl}`,
    ``,
    `This invitation expires in 7 days.`,
    ``,
    `— ${company}`,
  ].join("\n");

  await sendWhatsApp({ to: phone, body: message });
}

/**
 * Send an account status notification via WhatsApp.
 */
export async function sendAccountStatusWhatsApp(
  phone: string,
  name: string,
  status: "suspended" | "reactivated",
  storeName?: string,
): Promise<void> {
  const isSuspended = status === "suspended";
  const company = storeName || "FusionZone";
  const message = [
    `🔔 *${company} — Account ${isSuspended ? "Suspended" : "Reactivated"}*`,
    ``,
    `Hi ${name},`,
    ``,
    `Your account has been *${isSuspended ? "suspended" : "reactivated"}*.`,
    ``,
    isSuspended
      ? `Please contact your administrator for more information.`
      : `You can now sign in to your dashboard.`,
    ``,
    `— ${company}`,
  ].join("\n");

  await sendWhatsApp({ to: phone, body: message });
}
