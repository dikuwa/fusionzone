/**
 * Shared base-URL helper for the application.
 *
 * Resolves local, preview, and future production URLs without ever falling
 * back to another deployment.
 */

export function getAppUrl(): string {
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "";
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : null) ||
    vercelUrl ||
    "http://localhost:3000";

  return url.replace(/\/+$/, "");
}

/**
 * Build a shareable document URL from a token.
 */
export function getDocumentShareUrl(token: string): string {
  return `${getAppUrl()}/api/documents/share/${token}`;
}
