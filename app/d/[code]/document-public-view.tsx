"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { DocumentType } from "@/lib/document-tokens";
import { buildWhatsAppUrl, formatWhatsAppPhone } from "@/lib/whatsapp-url";
import { useDashboardStore } from "@/lib/store/dashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentPublicViewProps {
  type: DocumentType;
  documentNumber: string;
  shortCode: string;
  data: Record<string, unknown>;
}

function formatCents(cents: number | undefined | null): string {
  if (cents == null) return "N$0.00";
  return `N$${(cents / 100).toLocaleString("en-NA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentPublicView({
  type,
  documentNumber,
  shortCode,
  data,
}: DocumentPublicViewProps) {
  const viewPdfUrl = `/d/${shortCode}/pdf`;
  const downloadPdfUrl = `/d/${shortCode}/download`;

  const typeLabel =
    type === "receipt"
      ? "Receipt"
      : type === "quotation"
        ? "Quotation"
        : "Invoice";

  const customerName = (data.customerName as string) || "Customer";
  const customerPhone = (data.customerPhone as string) || "";
  const subtotalCents = data.subtotalCents as number | undefined;
  const totalPaidCents = data.totalPaidCents as number | undefined;
  const balanceDueCents = data.balanceDueCents as number | undefined;
  const createdAt = data.createdAt as string | undefined;
  const paymentStatus = data.paymentStatus as string | undefined;
  const orderNumber = data.orderNumber as string | undefined;
  const status = data.status as string | undefined;
  const fulfillmentMethod = data.fulfillmentMethod as string | undefined;
  const courierFeeCents = data.courierFeeCents as number | undefined;

  const total =
    (subtotalCents || 0) +
    (fulfillmentMethod === "courier" ? courierFeeCents || 0 : 0);

  const isPaidInFull =
    paymentStatus === "PaidInFull" ||
    (totalPaidCents != null && balanceDueCents != null && totalPaidCents >= total);

  const storeSettings = useDashboardStore((s) => s.settings);
  const BUSINESS_WHATSAPP = storeSettings.whatsapp || "264000000000";

  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleViewPdf = () => {
    setPdfLoading("view");
    const a = document.createElement("a");
    a.href = viewPdfUrl;
    a.target = "_blank";
    a.rel = "noopener,noreferrer";
    a.click();
    setTimeout(() => setPdfLoading(null), 1000);
  };

  const handleDownloadPdf = () => {
    setPdfLoading("download");
    const a = document.createElement("a");
    a.href = downloadPdfUrl;
    a.download = `${typeLabel}-${documentNumber}.pdf`;
    a.click();
    setTimeout(() => setPdfLoading(null), 1000);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : viewPdfUrl;

  const formatPhone = (phone: string) => phone.replace(/[^0-9]/g, "");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleWhatsApp = () => {
    const msg = `Here is your ${typeLabel.toLowerCase()} ${documentNumber} from FusionZone.\n\nView online: ${shareUrl}`;
    const formattedPhone = formatWhatsAppPhone(BUSINESS_WHATSAPP);
    const url = buildWhatsAppUrl(formattedPhone, msg);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener,noreferrer";
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header with branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/fusionzone-logo-blue.png"
              alt="FusionZone"
              className="h-9 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <h1 className="text-base font-bold text-foreground">
                FusionZone
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Namibia&rsquo;s trusted tech supplier
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground tracking-wider">
            {typeLabel.toUpperCase()}
          </span>
        </div>

        {/* Document card */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Summary header */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Document
              </p>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  isPaidInFull || status === "Accepted"
                    ? "border-success/30 bg-success-soft/50 text-success"
                    : status === "Declined"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-warning/30 bg-warning-soft/50 text-warning"
                }`}
              >
                {type === "receipt"
                  ? isPaidInFull
                    ? "Paid in Full"
                    : paymentStatus === "DepositPaid"
                      ? "Deposit Paid"
                      : paymentStatus || "Issued"
                  : status || "Sent"}
              </span>
            </div>
            <p className="text-lg font-bold text-foreground font-mono tracking-tight">
              {documentNumber}
            </p>
          </div>

          {/* Customer */}
          <div className="px-5 py-3 border-b border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Customer
            </p>
            <p className="text-sm font-semibold text-foreground">
              {customerName}
            </p>
            {customerPhone && (
              <p className="text-xs text-muted-foreground">{customerPhone}</p>
            )}
          </div>

          {/* Details grid */}
          <div className="px-5 py-3 border-b border-border grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                Date
              </p>
              <p className="text-sm text-foreground">{formatDate(createdAt)}</p>
            </div>
            {orderNumber && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  {type === "quotation" ? "Reference" : "Order"}
                </p>
                <p className="text-sm text-foreground font-mono">
                  {orderNumber}
                </p>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="px-5 py-4 border-b border-border">
            <div className="space-y-1.5 ml-auto max-w-[200px]">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">
                  {formatCents(subtotalCents)}
                </span>
              </div>
              {fulfillmentMethod === "courier" && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Courier Fee</span>
                  <span className="font-medium text-foreground">
                    {formatCents(courierFeeCents)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-border pt-1.5 mt-1.5">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{formatCents(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment summary */}
          {(type === "receipt" || type === "invoice") &&
            (totalPaidCents != null || balanceDueCents != null) && (
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Payment Summary
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-success-soft/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-success mb-1">
                      Paid
                    </p>
                    <p className="text-lg font-bold text-success">
                      {formatCents(totalPaidCents)}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      isPaidInFull
                        ? "bg-success-soft/50"
                        : "bg-warning-soft/50"
                    }`}
                  >
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                        isPaidInFull ? "text-success" : "text-warning"
                      }`}
                    >
                      {isPaidInFull ? "Settled" : "Balance Due"}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        isPaidInFull ? "text-success" : "text-destructive"
                      }`}
                    >
                      {isPaidInFull ? "—" : formatCents(balanceDueCents)}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Compact Document Actions: View PDF | Download | Copy Link */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleViewPdf}
            disabled={pdfLoading === "view"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted hover:text-primary transition-colors disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View PDF
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading === "download"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted hover:text-primary transition-colors disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted hover:text-primary transition-colors"
          >
            {copied ? (
              <svg className="h-3.5 w-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            )}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Footer branding */}
        <div className="text-center text-[10px] text-muted-foreground">
          <p>{storeSettings.storeName} &mdash; {storeSettings.address}</p>
          <p className="mt-0.5">
            {storeSettings.phone} &mdash; {storeSettings.email}
          </p>
        </div>
      </div>
    </div>
  );
}
