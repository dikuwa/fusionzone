"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Download,
  CheckCircle2,
  Banknote,
  User,
  FileText,
  MessageCircle,
  Copy,
  Mail,
} from "lucide-react";
import { useDashboardStore } from "@/lib/store/dashboard";
import { cn } from "@/lib/utils";
import {
  formatCents,
  getStatusBadgeClass,
  getStatusLabel,
  computePaymentFields,
} from "@/lib/dashboard-data";
import { formatPhone } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";
import { toast } from "sonner";

export default function OrderReceiptPage() {
  const orderId = useParams().id as string;

  const order = useDashboardStore((s) => s.orders.find((o) => o.id === orderId));
  const payments = useDashboardStore((s) => s.payments);
  const addNotification = useDashboardStore((s) => s.addNotification);
  const storeSettings = useDashboardStore((s) => s.settings);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-lg font-semibold text-foreground">Order not found</p>
        <Link href="/dashboard/orders" className="mt-2 text-sm text-primary hover:text-primary/80">
          Back to Orders
        </Link>
      </div>
    );
  }

  const orderPayments = payments.filter((p) => p.orderNumber === order.orderNumber);
  const { totalPaidCents, balanceDueCents: balanceCents } = computePaymentFields(
    order.subtotalCents,
    order.paymentStatus,
    orderPayments,
  );
  const isPaidInFull = order.paymentStatus === "PaidInFull" || (balanceCents <= 0 && order.paymentStatus !== "Unpaid");
  const isDepositPaid = order.paymentStatus === "DepositPaid";

  const receiptNumber = `RCP-${order.orderNumber.replace("DT-", "")}`;


  const [customerLink, setCustomerLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch("/api/receipts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderSnapshot: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items: order.items?.length
              ? order.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  unitPrice: item.unitPriceCents,
                  total: item.unitPriceCents * item.quantity,
                  sku: item.sku,
                }))
              : Array.from({ length: order.itemCount }, (_, index) => {
                  const unitPrice = Math.round(order.subtotalCents / order.itemCount);
                  const total = index === order.itemCount - 1
                    ? order.subtotalCents - unitPrice * (order.itemCount - 1)
                    : unitPrice;
                  return { name: `Product ${index + 1}`, quantity: 1, unitPrice: total, total };
                }),
            subtotalCents: order.subtotalCents,
            paymentStatus: order.paymentStatus,
            totalPaidCents,
            balanceDueCents: balanceCents,
            createdAt: order.createdAt,
            fulfillmentMethod: order.fulfillmentMethod,
            courierFeeCents: order.courierFeeCents,
            shipping: order.shipping,
          },
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Failed to generate");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${order.orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Receipt PDF downloaded");
    } catch (err) {
      console.error("Receipt PDF download failed:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const items = order.items?.length
        ? order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents,
            total: item.unitPriceCents * item.quantity,
            sku: item.sku,
          }))
        : [];

      const res = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "receipt",
          referenceId: order.orderNumber,
          documentNumber: receiptNumber,
          data: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            subtotalCents: order.subtotalCents,
            paymentStatus: order.paymentStatus,
            totalPaidCents,
            balanceDueCents: balanceCents,
            createdAt: order.createdAt,
            fulfillmentMethod: order.fulfillmentMethod,
            courierFeeCents: order.courierFeeCents,
            shipping: order.shipping,
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
      setCustomerLink(shareUrl);
      toast.success("Shareable link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleGenerateCustomerLink = async () => {
    setGeneratingLink(true);
    try {
      const items = order.items?.length
        ? order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents,
            total: item.unitPriceCents * item.quantity,
            sku: item.sku,
          }))
        : [];

      const res = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "receipt",
          referenceId: order.orderNumber,
          documentNumber: receiptNumber,
          data: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            subtotalCents: order.subtotalCents,
            paymentStatus: order.paymentStatus,
            totalPaidCents,
            balanceDueCents: balanceCents,
            createdAt: order.createdAt,
            fulfillmentMethod: order.fulfillmentMethod,
            courierFeeCents: order.courierFeeCents,
            shipping: order.shipping,
          },
        }),
      });
      const data = await res.json();
      const shareUrl = data.shortUrl ?? data.url;
      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        setCustomerLink(shareUrl);
        toast.success("Customer link copied to clipboard");
      } else {
        toast.error("Failed to generate link");
      }
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      const items = order.items?.length
        ? order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents,
            total: item.unitPriceCents * item.quantity,
            sku: item.sku,
          }))
        : [];

      const res = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "receipt",
          referenceId: order.orderNumber,
          documentNumber: receiptNumber,
          data: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            subtotalCents: order.subtotalCents,
            paymentStatus: order.paymentStatus,
            totalPaidCents,
            balanceDueCents: balanceCents,
            createdAt: order.createdAt,
            fulfillmentMethod: order.fulfillmentMethod,
            courierFeeCents: order.courierFeeCents,
            shipping: order.shipping,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to generate shareable link");
        return;
      }

      const shareUrl = data.shortUrl ?? data.url;
      setCustomerLink(shareUrl);

      const msg = `Hi ${order.customerName}, here is your receipt for ${order.orderNumber}. Total: ${formatCents(order.subtotalCents)}. ${isDepositPaid ? `Paid: ${formatCents(totalPaidCents)}, Balance due: ${formatCents(balanceCents)}.` : isPaidInFull ? "Paid in full." : ""}\n\nView online: ${shareUrl}`;
      const customerPhone = formatPhone(order.customerPhone);
      if (!customerPhone) {
        toast.error("No WhatsApp number available for this customer.");
        return;
      }
      const wa = document.createElement("a");
      wa.href = buildWhatsAppUrl(customerPhone, msg);
      wa.target = "_blank";
      wa.rel = "noopener,noreferrer";
      wa.click();
    } catch {
      toast.error("Failed to generate shareable link");
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
      // Generate a share token first
      const items = order.items?.length
        ? order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents,
            total: item.unitPriceCents * item.quantity,
            sku: item.sku,
          }))
        : [];

      const tokenRes = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "receipt",
          referenceId: order.orderNumber,
          documentNumber: receiptNumber,
          data: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            subtotalCents: order.subtotalCents,
            paymentStatus: order.paymentStatus,
            totalPaidCents,
            balanceDueCents: balanceCents,
            createdAt: order.createdAt,
            fulfillmentMethod: order.fulfillmentMethod,
            courierFeeCents: order.courierFeeCents,
            shipping: order.shipping,
          },
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.success) {
        toast.error("Failed to generate shareable link");
        return;
      }

      const shareUrl = tokenData.shortUrl ?? tokenData.url;

      // Call the send-email API to send PDF as attachment
      const emailRes = await fetch("/api/documents/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "receipt",
          recipientEmail,
          recipientName: order.customerName,
          documentNumber: receiptNumber,
          subject: `Receipt for ${order.orderNumber} - ${storeSettings.storeName}`,
          messageBody: `Please find your receipt for ${order.orderNumber} attached.`,
          shareUrl,
          orderSnapshot: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items: items.length
              ? items
              : [{ name: `${order.itemCount} items`, quantity: 1, unitPrice: order.subtotalCents, total: order.subtotalCents }],
            subtotalCents: order.subtotalCents,
            paymentStatus: order.paymentStatus,
            totalPaidCents,
            balanceDueCents: balanceCents,
            createdAt: order.createdAt,
            fulfillmentMethod: order.fulfillmentMethod,
            courierFeeCents: order.courierFeeCents,
            shipping: order.shipping,
          },
        }),
      });
      const emailData = await emailRes.json();
      if (emailData.success) {
        toast.success("Receipt emailed with PDF attachment");
      } else {
        // Fallback to mailto: if API fails
        const paymentLine = isDepositPaid
          ? `Paid: ${formatCents(totalPaidCents)}, Balance due: ${formatCents(balanceCents)}`
          : isPaidInFull
            ? "Paid in full."
            : `Payment status: ${getStatusLabel(order.paymentStatus)}`;
        const subject = encodeURIComponent(`Receipt for ${order.orderNumber} - ${storeSettings.storeName}`);
        const body = encodeURIComponent(
          `Hi ${order.customerName},\n\nPlease find your receipt for ${order.orderNumber} below.\n\n${shareUrl}\n\nTotal: ${formatCents(order.subtotalCents)}\n${paymentLine}\n\nThank you for your business!\n${storeSettings.storeName}\n${storeSettings.email || ""}`,
        );
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
        toast.error(emailData.error || "Failed to send email, opened mail client instead");
      }
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
      setEmailInput("");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Consolidated Actions: flex justify-between layout */}
      <div className="rounded-xl border border-border bg-card p-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left Column: Share & Send */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Share &amp; Send</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(!order.preferredContact || order.preferredContact.length === 0 || order.preferredContact.includes("WhatsApp")) && (
                <button
                  onClick={handleSendWhatsApp}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-whatsapp/20 px-3 py-2 text-xs font-medium text-whatsapp hover:bg-whatsapp hover:text-white transition-colors"
                  title="Send receipt via WhatsApp"
                  aria-label="Send receipt via WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </button>
              )}
              {(!order.preferredContact || order.preferredContact.length === 0 || order.preferredContact.includes("Email")) && (
                <button
                  onClick={() => handleSendEmail()}
                  disabled={sendingEmail}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                  title="Send receipt via Email"
                  aria-label="Send receipt via Email"
                >
                  {sendingEmail ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  Email
                </button>
              )}
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                title="Copy receipt link"
                aria-label="Copy receipt link"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Link
              </button>
            </div>
          </div>

          {/* Right Column: Document — pushed right on desktop */}
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
                title="Download receipt PDF"
                aria-label="Download receipt PDF"
              >
                {downloadingPdf ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                title="Print receipt"
                aria-label="Print receipt"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email input prompt */}
      {showEmailInput && (
        <div className="rounded-xl border border-border bg-card p-4 print:hidden">
          <p className="text-xs font-semibold text-foreground mb-2">Enter customer email to send receipt:</p>
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

      {/* Back link */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard/orders/${order.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Order
        </Link>
      </div>

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

      {/* Receipt Card */}
      <div className="rounded-xl border border-border bg-card print:border-0 print:shadow-none">
        {/* Header with Logo */}
        <div className="px-6 py-5 border-b border-border flex items-start justify-between">
          <div className="flex items-start gap-3">
            <img
              src="/images/fusionzone-logo-blue.png"
              alt="FusionZone"
              className="h-10 w-auto object-contain mt-0.5"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
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
              RECEIPT
            </span>
            <p className="text-sm font-bold text-foreground mt-1.5 font-mono">{receiptNumber}</p>
          </div>
        </div>

        {/* Order Info */}
        <div className="px-6 py-4 border-b border-border grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Order #</p>
            <p className="font-semibold text-foreground font-mono">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Date</p>
            <p className="text-foreground">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Status</p>
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", getStatusBadgeClass(order.fulfillmentStatus))}>
              {getStatusLabel(order.fulfillmentStatus)}
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
              <p className="text-sm font-semibold text-foreground">{order.customerName}</p>
              <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
              <p className="text-xs text-muted-foreground">Contact via {Array.isArray(order.preferredContact) ? order.preferredContact.join(", ") : order.preferredContact}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Items</p>
          <div className="space-y-2">
            {/* Header row */}
            <div className="flex items-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wider pb-1 border-b border-border">
              <span className="flex-[2]">Description</span>
              <span className="w-24 text-center">SKU</span>
              <span className="w-12 text-center">Qty</span>
              <span className="w-20 text-right">Price</span>
              <span className="w-20 text-right">Total</span>
            </div>
            {/* Item rows */}
            {(order.items?.length
              ? order.items
              : [{ name: `${order.itemCount} item${order.itemCount !== 1 ? "s" : ""}`, quantity: order.itemCount, unitPriceCents: order.subtotalCents / order.itemCount, sku: undefined }]
            ).map((item, index) => (
              <div key={`${item.name}-${index}`} className="document-item-row flex items-center text-sm">
                <span className="flex-[2] text-foreground">{item.name}</span>
                <span className="w-24 text-center"><span className="text-[11px] font-mono text-muted-foreground">{item.sku || "—"}</span></span>
                <span className="w-12 text-center text-muted-foreground">{item.quantity}</span>
                <span className="w-20 text-right text-foreground">{formatCents(item.unitPriceCents)}</span>
                <span className="w-20 text-right font-semibold text-foreground">{formatCents(item.unitPriceCents * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-b border-border">
          <div className="space-y-1.5 ml-auto max-w-[240px]">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatCents(order.subtotalCents)}</span>
            </div>
            {order.fulfillmentMethod === "courier" ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Courier Fee</span>
                <span className="font-medium text-foreground">{formatCents(order.courierFeeCents || 0)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collection</span>
                <span className="font-medium text-success">Free</span>
              </div>
            )}
            {order.shipping && (
              <div className="text-xs text-muted-foreground border-t border-border/50 pt-2 mt-1 space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider">Shipping Address</p>
                <p>{order.shipping.recipientName}</p>
                <p>{order.shipping.phone}</p>
                <p>{order.shipping.address}</p>
                <p>{order.shipping.city}, {order.shipping.region}</p>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-border pt-1.5 mt-1.5">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{formatCents(order.subtotalCents + (order.fulfillmentMethod === "courier" ? (order.courierFeeCents || 0) : 0))}</span>
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Payment Summary</p>

          {/* Payment status badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", getStatusBadgeClass(order.paymentStatus))}>
              {getStatusLabel(order.paymentStatus)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-success-soft/50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-success mb-1">Paid</p>
              <p className="text-lg font-bold text-success">{formatCents(totalPaidCents)}</p>
              <p className="text-[10px] text-success/70 mt-0.5">{orderPayments.length} record{orderPayments.length !== 1 ? "s" : ""}</p>
            </div>
            <div className={cn("rounded-lg p-3", isPaidInFull ? "bg-success-soft/50" : "bg-warning-soft/50")}>
              <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1", isPaidInFull ? "text-success" : "text-warning")}>
                {isPaidInFull ? "Settled" : "Balance Due"}
              </p>
              <p className={cn("text-lg font-bold", isPaidInFull ? "text-success" : "text-destructive")}>
                {isPaidInFull ? "—" : formatCents(balanceCents)}
              </p>
            </div>
          </div>

          {/* Payment records */}
          {orderPayments.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Records</p>
              <div className="space-y-1.5">
                {orderPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{p.method}</span>
                      {p.note && <span className="text-muted-foreground/60">— {p.note}</span>}
                    </div>
                    <span className="font-semibold text-foreground">{formatCents(p.amountCents)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deposit notification */}
          {isDepositPaid && balanceCents > 0 && (
            <div className="mt-4 rounded-lg border border-warning/20 bg-warning-soft/50 px-4 py-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-warning">Deposit Received</p>
                <p className="text-[11px] text-warning/80 mt-0.5">
                  {formatCents(totalPaidCents)} received. <strong>{formatCents(balanceCents)}</strong> remaining. Awaiting final payment to complete the order.
                </p>
              </div>
            </div>
          )}

          {/* Paid in full confirmation */}
          {isPaidInFull && (
            <div className="mt-4 rounded-lg border border-success/20 bg-success-soft/50 px-4 py-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-success">Paid in Full</p>
                <p className="text-[11px] text-success/80 mt-0.5">
                  {formatCents(totalPaidCents)} received. No outstanding balance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-muted-foreground print:hidden">
        <p>{storeSettings.storeName || "FusionZone"} &mdash; {storeSettings.address || "Windhoek, Namibia"}</p>
        <p className="mt-0.5">{storeSettings.email} &mdash; {storeSettings.phone || "+264 00 000 0000"}</p>
      </div>
    </div>
  );
}
