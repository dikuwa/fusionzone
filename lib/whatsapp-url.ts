/**
 * WhatsApp URL utility for FusionZone.
 *
 * Provides a shared phone formatter and wa.me link generator
 * so every WhatsApp button across the site uses the same logic.
 *
 * Phone formatting:
 *   - Strip spaces, plus signs, brackets, dashes
 *   - If the number starts with 0, replace leading 0 with 264
 *
 * URL format:
 *   https://wa.me/<international_number>?text=<encoded_message>
 *
 * Never use api.whatsapp.com/resolve links.
 */

const BUSINESS_WHATSAPP = "264000000000";

/**
 * Format a phone number for WhatsApp wa.me links.
 *
 * Examples:
 *   "085 277 5140"  → "264000000000"
 *   "+264 00 000 0000" → "264000000000"
 *   "264000000000"  → "264000000000"
 */
export function formatWhatsAppPhone(phone: string): string {
  // Strip all non-digit characters
  const digits = phone.replace(/[^0-9]/g, "");
  // If starts with 0, replace with Namibia country code 264
  if (digits.startsWith("0")) {
    return "264" + digits.slice(1);
  }
  // If already starts with 264, keep as-is
  if (digits.startsWith("264")) {
    return digits;
  }
  // Otherwise, just return the digits (assume already international)
  return digits;
}

/**
 * Get a business WhatsApp URL. Uses the store phone from settings
 * if available, falls back to the hardcoded business number.
 */
export function getBusinessWhatsApp(): string {
  if (typeof window !== "undefined") {
    try {
      const settings = localStorage.getItem("fusionzone-dashboard");
      if (settings) {
        const parsed = JSON.parse(settings);
        const state = parsed.state || parsed;
        const s = state.settings || state;
        if (s.whatsapp) return formatWhatsAppPhone(s.whatsapp);
      }
    } catch {
      // Ignore parse errors
    }
  }
  return BUSINESS_WHATSAPP;
}

/**
 * Generate a wa.me URL for business chat.
 */
export function getWhatsAppUrl(message?: string): string {
  const phone = getBusinessWhatsApp();
  return buildWhatsAppUrl(phone, message);
}

/**
 * Generate a wa.me URL for a specific phone number and optional message.
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const formatted = formatWhatsAppPhone(phone);
  if (message) {
    return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${formatted}`;
}

/**
 * Default messages for common contexts.
 */
export const WHATSAPP_MESSAGES = {
  general: "Hi, I need help with an order/product.",
  product: (name: string) =>
    `Hi, I'm interested in this product: ${name}.`,
  promotion: (title: string) =>
    `Hi, I'm interested in this promotion: ${title}.`,
  receipt: (orderNumber: string, link: string) =>
    `Please see this document for order ${orderNumber}: ${link}`,
  followUp: (customerName: string, orderNumber: string) =>
    `Hi ${customerName}, following up on your order ${orderNumber}.`,
  enquiry: (items: string[]) =>
    `Hi, I'm interested in these products: ${items.join(", ")}.`,
} as const;
