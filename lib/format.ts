/**
 * Human-readable money utilities.
 *
 * Internal format: cents (integer).  E.g. N$24,999 = 2,499,900 cents.
 * Human format:    dollars with optional decimal. E.g. "24999" or "24,999" or "24999.00"
 */

/** Strip commas and parse a human money string to cents. */
export function parseHumanToCents(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/** Convert cents to a human dollar string (e.g. 2499900 → "24999.00"). */
export function centsToHuman(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Format a phone number for WhatsApp/URL use by stripping all non-digit characters.
 * E.g. "+264 00 000 0000" → "264000000000"
 */
export function formatPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}
