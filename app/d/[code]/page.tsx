/**
 * Public document share page — /d/[code]
 *
 * Resolves a short link code to the underlying signed document token,
 * then displays a branded summary with View PDF and Download PDF buttons.
 *
 * This page works without authentication (intended for customer sharing).
 * It survives redeploys because the document data is encoded in the
 * signed token.
 */
import { resolveShortLink } from "@/lib/document-share";
import { verifyDocumentToken } from "@/lib/document-tokens";
import { DocumentPublicView } from "./document-public-view";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function DocumentSharePage({ params }: Props) {
  const { code } = await params;

  // Resolve the short code to a signed token
  let result;
  try {
    result = await resolveShortLink(code);
  } catch (err) {
    console.error("[DocumentShare] Failed to resolve short link:", err);
    return <ErrorState error={{ code: "NOT_FOUND", message: "This document link is invalid or has expired." }} />;
  }

  // Handle error states
  if (!result.ok) {
    return <ErrorState error={{ code: result.code, message: result.message }} />;
  }

  // Verify the underlying signed token and extract document data
  const payload = verifyDocumentToken(result.token);
  if (!payload) {
    return <ErrorState error={{ code: "TOKEN_INVALID", message: "This document link is invalid or has expired." }} />;
  }

  const doc = payload.data || {};

  return (
    <DocumentPublicView
      type={payload.type}
      documentNumber={payload.documentNumber}
      shortCode={code}
      data={doc as any}
    />
  );
}

// ---------------------------------------------------------------------------
// Error State
// ---------------------------------------------------------------------------

function ErrorState({ error }: { error: { code: string; message: string } }) {
  const isExpired = error.code === "EXPIRED";
  const isRevoked = error.code === "REVOKED";
  const isNotFound = error.code === "NOT_FOUND" || error.code === "TOKEN_INVALID";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3">
            <img
              src="/images/fusionzone-logo-blue.png"
              alt="FusionZone"
              className="h-10 w-auto"
            />
            <span className="text-lg font-bold text-foreground">
              FusionZone
            </span>
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isExpired
                ? "bg-warning-soft text-warning"
                : isRevoked
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isExpired ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : isRevoked ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            {isExpired
              ? "Document Link Expired"
              : isRevoked
                ? "Document Link Revoked"
                : "Document Not Found"}
          </h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>

        {/* Contact info */}
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Need help?</p>
          <p>Contact FusionZone for assistance.</p>
          <p className="mt-2 text-xs">
            FusionZone &mdash; Windhoek, Namibia
          </p>
        </div>
      </div>
    </div>
  );
}
