"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  MessageCircle,
  Copy,
  User,
  Trash2,
  Pencil,
  Download,
  Mail,
} from "lucide-react";
import { useDashboardStore } from "@/lib/store/dashboard";
import { cn } from "@/lib/utils";
import {
  formatCents,
  getStatusBadgeClass,
  getStatusLabel,
} from "@/lib/dashboard-data";
import { formatPhone } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function QuotationDetailPage() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const quotation = useDashboardStore((s) =>
    s.quotations.find((q) => q.id === params.id),
  );
  const updateQuotationStatus = useDashboardStore((s) => s.updateQuotationStatus);
  const deleteQuotation = useDashboardStore((s) => s.deleteQuotation);
  const storeSettings = useDashboardStore((s) => s.settings);

  if (!quotation) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-lg font-semibold text-foreground">Quotation not found</p>
        <Link
          href="/dashboard/quotations"
          className="mt-2 text-sm text-primary hover:text-primary/80"
        >
          Back to Quotations
        </Link>
      </div>
    );
  }

  const handlePrint = () => window.print();

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = async () => {
    try {
      const items = quotation.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPriceCents,
        total: item.unitPriceCents * item.quantity,
        sku: item.sku,
      }));

      const res = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quotation",
          referenceId: quotation.id,
          documentNumber: quotation.quotationNumber,
          data: {
            quotationNumber: quotation.quotationNumber,
            customerName: quotation.customerName,
            customerPhone: quotation.customerPhone,
            items,
            subtotalCents: quotation.subtotalCents,
            status: quotation.status,
            notes: quotation.notes,
            createdAt: quotation.createdAt,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to generate shareable link");
        return;
      }
      const shareUrl = data.shortUrl ?? data.url;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success("Shareable link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Copy link failed:", err);
      toast.error("Failed to copy link");
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      const items = quotation.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPriceCents,
        total: item.unitPriceCents * item.quantity,
        sku: item.sku,
      }));

      const res = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quotation",
          referenceId: quotation.id,
          documentNumber: quotation.quotationNumber,
          data: {
            quotationNumber: quotation.quotationNumber,
            customerName: quotation.customerName,
            customerPhone: quotation.customerPhone,
            items,
            subtotalCents: quotation.subtotalCents,
            status: quotation.status,
            notes: quotation.notes,
            createdAt: quotation.createdAt,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to generate shareable link");
        return;
      }

      const itemsList = quotation.items
        .map(
          (item) =>
            `${item.name} x${item.quantity} — ${formatCents(item.unitPriceCents * item.quantity)}`,
        )
        .join("\n");

      const shareUrl = data.shortUrl ?? data.url;
      const msg = `*Quotation ${quotation.quotationNumber} — ${storeSettings.storeName}*\n\n` +
          `Hi ${quotation.customerName},\n\n` +
          `Here is your quotation:\n\n` +
          `${itemsList}\n\n` +
          `*Total: ${formatCents(quotation.subtotalCents)}*\n\n` +
          `${quotation.notes ? `Notes: ${quotation.notes}\n\n` : ""}` +
          `View quotation: ${shareUrl}\n\n` +
          `Contact us:\n` +
          `${storeSettings.phone}\n` +
          `${storeSettings.email}`;
      const customerPhone = formatPhone(quotation.customerPhone);
      if (!customerPhone) {
        toast.error("No WhatsApp number available for this customer.");
        return;
      }
      const wa = document.createElement("a");
      wa.href = buildWhatsAppUrl(customerPhone, msg);
      wa.target = "_blank";
      wa.rel = "noopener,noreferrer";
      wa.click();
    } catch (err) {
      console.error("WhatsApp share failed:", err);
      toast.error("Failed to generate shareable link");
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const items = quotation.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPriceCents,
        total: item.unitPriceCents * item.quantity,
        sku: item.sku,
      }));

      const res = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quotation",
          referenceId: quotation.id,
          documentNumber: quotation.quotationNumber,
          data: {
            quotationNumber: quotation.quotationNumber,
            customerName: quotation.customerName,
            customerPhone: quotation.customerPhone,
            items,
            subtotalCents: quotation.subtotalCents,
            status: quotation.status,
            notes: quotation.notes,
            createdAt: quotation.createdAt,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error("Failed to generate link");
      window.open(data.shortUrl ?? data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to open PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendEmail = async (email?: string) => {
    const recipientEmail = email || emailInput;
    if (!recipientEmail) {
      setShowEmailInput(true);
      return;
    }
    setSendingEmail(true);
    setShowEmailInput(false);
    try {
      const items = quotation.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPriceCents,
        total: item.unitPriceCents * item.quantity,
        sku: item.sku,
      }));

      // Generate shareable token
      const tokenRes = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quotation",
          referenceId: quotation.id,
          documentNumber: quotation.quotationNumber,
          data: {
            quotationNumber: quotation.quotationNumber,
            customerName: quotation.customerName,
            customerPhone: quotation.customerPhone,
            items,
            subtotalCents: quotation.subtotalCents,
            status: quotation.status,
            notes: quotation.notes,
            createdAt: quotation.createdAt,
          },
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.success) {
        toast.error("Failed to generate shareable link");
        return;
      }

      const shareUrl = tokenData.shortUrl ?? tokenData.url;

      // Send via the send-email API with PDF attachment
      const emailRes = await fetch("/api/documents/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "quotation",
          recipientEmail,
          recipientName: quotation.customerName,
          documentNumber: quotation.quotationNumber,
          subject: `Quotation ${quotation.quotationNumber} - ${storeSettings.storeName}`,
          messageBody: `Please find your quotation ${quotation.quotationNumber} attached.\n\nTotal: ${formatCents(quotation.subtotalCents)}${quotation.notes ? `\n\nNotes: ${quotation.notes}` : ""}`,
          shareUrl,
          quotationSnapshot: {
            quotationNumber: quotation.quotationNumber,
            customerName: quotation.customerName,
            customerPhone: quotation.customerPhone,
            items,
            subtotalCents: quotation.subtotalCents,
            notes: quotation.notes,
            status: quotation.status,
            createdAt: quotation.createdAt,
          },
        }),
      });
      const emailData = await emailRes.json();
      if (emailData.success) {
        toast.success("Quotation sent via email with PDF attachment");
      } else {
        // Fallback to mailto
        const subject = encodeURIComponent(`Quotation ${quotation.quotationNumber} - ${storeSettings.storeName}`);
        const body = encodeURIComponent(
          `Hi ${quotation.customerName},\n\nPlease find your quotation ${quotation.quotationNumber} below.\n\n${shareUrl}\n\nTotal: ${formatCents(quotation.subtotalCents)}\n\n${quotation.notes ? `Notes: ${quotation.notes}\n\n` : ""}Thank you for your interest!\n${storeSettings.storeName}\n${storeSettings.email || ""}`,
        );
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
        toast.error(emailData.error || "Failed to send email, opened mail client instead");
      }
    } catch (err) {
      console.error("Send email failed:", err);
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
      setEmailInput("");
    }
  };

  const handleDelete = () => {
    deleteQuotation(quotation.id);
    toast.success("Quotation deleted");
    router.push("/dashboard/quotations");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back link */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/quotations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quotations
        </Link>
      </div>

      {/* Status / Workflow Actions */}
      <div className="rounded-xl border border-border bg-card p-4 print:hidden">
        <div className="flex items-center gap-2 mb-2">
          <Send className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quotation Status</span>
          <span className={cn("ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", getStatusBadgeClass(quotation.status))}>
            {getStatusLabel(quotation.status)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {quotation.status === "Draft" && (
            <button
              onClick={() => {
                updateQuotationStatus(quotation.id, "Sent");
                toast.success("Quotation marked as sent");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 px-3 py-2 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Mark as Sent
            </button>
          )}
          {quotation.status === "Sent" && (
            <>
              <button
                onClick={() => {
                  updateQuotationStatus(quotation.id, "Accepted");
                  toast.success("Quotation accepted");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-success/20 px-3 py-2 text-xs font-medium text-success hover:bg-success hover:text-white transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark as Accepted
              </button>
              <button
                onClick={() => {
                  updateQuotationStatus(quotation.id, "Declined");
                  toast.success("Quotation declined");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/20 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                Mark as Declined
              </button>
            </>
          )}
          {quotation.status !== "Draft" && quotation.status !== "Sent" && (
            <span className="text-xs text-muted-foreground">
              This quotation has been {quotation.status.toLowerCase()}.
            </span>
          )}
        </div>
      </div>

      {/* Email input prompt */}
      {showEmailInput && (
        <div className="rounded-xl border border-border bg-card p-4 print:hidden">
          <p className="text-xs font-semibold text-foreground mb-2">Enter customer email to send quotation:</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="customer@example.com"
              autoFocus
              className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              onKeyDown={(e) => { if (e.key === "Enter") handleSendEmail(emailInput); if (e.key === "Escape") setShowEmailInput(false); }}
            />
            <button
              onClick={() => handleSendEmail(emailInput)}
              disabled={!emailInput || sendingEmail}
              className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {sendingEmail ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => { setShowEmailInput(false); setEmailInput(""); }}
              className="h-9 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Share & Send + Document combined card */}
      <div className="rounded-xl border border-border bg-card p-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left: Share & Send */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Share &amp; Send</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSendWhatsApp}
                className="inline-flex items-center gap-1.5 rounded-lg border border-whatsapp/20 px-3 py-2 text-xs font-medium text-whatsapp hover:bg-whatsapp hover:text-white transition-colors"
                title="Send quotation via WhatsApp"
                aria-label="Send quotation via WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </button>
              <button
                onClick={() => handleSendEmail()}
                disabled={sendingEmail}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                title="Send quotation via Email"
                aria-label="Send quotation via Email"
              >
                {sendingEmail ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                Email
              </button>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                title="Copy quotation link"
                aria-label="Copy quotation link"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Link
              </button>
            </div>
          </div>

          {/* Right: Document — pushed right on desktop */}
          <div className="sm:text-right sm:self-end">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Document</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:text-primary hover:border-primary/30 hover:bg-accent transition-colors disabled:opacity-50"
                title="Download quotation PDF"
                aria-label="Download quotation PDF"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                title="Print quotation"
                aria-label="Print quotation"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
              <Link
                href={`/dashboard/quotations/${quotation.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                title="Edit quotation"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
              <button
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                title="Delete quotation"
                aria-label="Delete quotation"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {quotation.quotationNumber} for {quotation.customerName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print-only styles */}
      <style>{`
        @media print {
          @page { margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .document-item-row { break-inside: avoid; page-break-inside: avoid; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Quotation Card */}
      <div className="rounded-xl border border-border bg-card print:border-0 print:shadow-none">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-start justify-between">
          <div className="flex items-start gap-3">
            <img
              src="/images/fusionzone-logo-blue.png"
              alt="FusionZone"
              className="h-10 w-auto object-contain mt-0.5"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div>
              <h2 className="text-base font-bold text-foreground">{storeSettings.storeName || "FusionZone"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{storeSettings.address || "Windhoek, Namibia"}</p>
              <p className="text-xs text-muted-foreground">{storeSettings.phone || "+264 00 000 0000"}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground tracking-wider">
              QUOTATION
            </span>
            <p className="text-sm font-bold text-foreground mt-1.5 font-mono">{quotation.quotationNumber}</p>
          </div>
        </div>

        {/* Status + Date */}
        <div className="px-6 py-4 border-b border-border grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Quotation #</p>
            <p className="font-semibold text-foreground font-mono">{quotation.quotationNumber}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Date</p>
            <p className="text-foreground">{new Date(quotation.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Status</p>
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", getStatusBadgeClass(quotation.status))}>
              {getStatusLabel(quotation.status)}
            </span>
          </div>
        </div>

        {/* Customer */}
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Customer</p>
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{quotation.customerName}</p>
              <p className="text-xs text-muted-foreground">{quotation.customerPhone}</p>
              <p className="text-xs text-muted-foreground">Contact via {Array.isArray(quotation.preferredContact) ? quotation.preferredContact.join(", ") : quotation.preferredContact}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quoted Items</p>

          <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wider pb-1 border-b border-border">
              <span className="flex-[2]">Description</span>
              <span className="w-24 text-center">SKU</span>
              <span className="w-12 text-center">Qty</span>
              <span className="w-20 text-right">Unit Price</span>
              <span className="w-20 text-right">Total</span>
            </div>
            {/* Items */}
            {quotation.items.map((item, idx) => (
              <div key={idx} className="document-item-row flex items-center text-sm py-1">
                <span className="flex-[2] text-foreground">{item.name}</span>
                <span className="w-24 text-center"><span className="text-[11px] font-mono text-muted-foreground">{item.sku || "—"}</span></span>
                <span className="w-12 text-center text-muted-foreground">{item.quantity}</span>
                <span className="w-20 text-right text-foreground">{formatCents(item.unitPriceCents)}</span>
                <span className="w-20 text-right font-semibold text-foreground">
                  {formatCents(item.unitPriceCents * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-b border-border">
          <div className="space-y-1.5 ml-auto max-w-[240px]">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatCents(quotation.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-1.5 mt-1.5">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{formatCents(quotation.subtotalCents)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div className="px-6 py-4 border-b border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes</p>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{quotation.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 text-center">
          <p className="text-[10px] text-muted-foreground">
            {storeSettings.storeName} &mdash; {storeSettings.address}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {storeSettings.email} &mdash; {storeSettings.phone}
          </p>
        </div>
      </div>

      {/* Status timeline */}
      <div className="rounded-xl border border-border bg-card p-5 no-print">
        <p className="text-sm font-semibold text-foreground mb-3">Status Timeline</p>
        <div className="flex items-center gap-4 text-xs">
          <div className={cn(
            "flex items-center gap-1.5",
            quotation.status === "Draft" || quotation.status === "Sent" || quotation.status === "Accepted" || quotation.status === "Declined"
              ? "text-primary" : "text-muted-foreground",
          )}>
            <span className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full",
              quotation.status === "Draft" ? "bg-primary text-primary-foreground" : "bg-muted",
            )}>1</span>
            Draft
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={cn(
            "flex items-center gap-1.5",
            quotation.status === "Sent" || quotation.status === "Accepted" || quotation.status === "Declined"
              ? "text-primary" : "text-muted-foreground",
          )}>
            <span className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full",
              quotation.status === "Sent" ? "bg-primary text-primary-foreground" : quotation.status === "Accepted" || quotation.status === "Declined" ? "bg-muted" : "bg-muted",
            )}>2</span>
            Sent
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={cn(
            "flex items-center gap-1.5",
            quotation.status === "Accepted" ? "text-success" : quotation.status === "Declined" ? "text-destructive" : "text-muted-foreground",
          )}>
            <span className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full",
              quotation.status === "Accepted" ? "bg-success text-white" : quotation.status === "Declined" ? "bg-destructive text-destructive-foreground" : "bg-muted",
            )}>3</span>
            {quotation.status === "Declined" ? "Declined" : "Accepted"}
          </div>
        </div>
      </div>

      {/* Convert to order CTA - only for Accepted quotations */}
      {quotation.status === "Accepted" && (
        <div className="rounded-xl border border-success/20 bg-success-soft/50 p-5 flex items-center justify-between no-print">
          <div>
            <p className="text-sm font-semibold text-success">Quotation Accepted</p>
            <p className="text-xs text-success/80 mt-0.5">Create an order from this quotation to proceed.</p>
          </div>
          <Link
            href={`/dashboard/orders/new?quotationId=${quotation.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-xs font-semibold text-white hover:bg-success/90 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Create Order
          </Link>
        </div>
      )}
    </div>
  );
}
