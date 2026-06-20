"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Send,
  ExternalLink,
  Search,
  MessageCircle,
  Copy,
} from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { useDashboardStore } from "@/lib/store/dashboard";
import { computePaymentFields, formatCents, getStatusBadgeClass, getStatusLabel } from "@/lib/dashboard-data";
import { formatPhone } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;
export default function ReceiptsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const addNotification = useDashboardStore((s) => s.addNotification);
  const storeOrders = useDashboardStore((s) => s.orders);
  const payments = useDashboardStore((s) => s.payments);

  // Receipts from paid/deposit orders
  const paidOrders = storeOrders.filter(
    (o) => o.paymentStatus === "PaidInFull" || o.paymentStatus === "DepositPaid"
  );

  // Filtered receipts
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return paidOrders.filter((o) => {
      if (statusFilter !== "all" && o.paymentStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        o.customerName.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    });
  }, [paidOrders, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const receiptStatuses = ["all", "PaidInFull", "DepositPaid"];

  const handleDownloadPDF = async (orderNumber: string) => {
    setDownloading(orderNumber);
    try {
      const order = paidOrders.find((item) => item.orderNumber === orderNumber);
      if (!order) throw new Error("Order not found");
      const orderPayments = payments.filter((payment) => payment.orderNumber === order.orderNumber);
      const { totalPaidCents, balanceDueCents } = computePaymentFields(
        order.subtotalCents,
        order.paymentStatus,
        orderPayments,
        { fulfillmentMethod: order.fulfillmentMethod, courierFeeCents: order.courierFeeCents },
      );
      const res = await fetch("/api/receipts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderNumber,
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
            balanceDueCents,
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
      a.download = `receipt-${orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(null);
    }
  };

  const handleSendViaWhatsApp = async (orderNumber: string, customerName: string) => {
    try {
      // Build data snapshot from the order
      const order = paidOrders.find((o) => o.orderNumber === orderNumber);
      if (!order) {
        toast.error("Order not found");
        return;
      }
      const orderPayments = payments.filter((payment) => payment.orderNumber === order.orderNumber);
      const { totalPaidCents, balanceDueCents } = computePaymentFields(
        order.subtotalCents,
        order.paymentStatus,
        orderPayments,
        { fulfillmentMethod: order.fulfillmentMethod, courierFeeCents: order.courierFeeCents },
      );

      const items = order.items?.length
        ? order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents,
            total: item.unitPriceCents * item.quantity,
            sku: item.sku,
          }))
        : [];

      // Generate document token with data snapshot
      const res = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "receipt",
          referenceId: orderNumber,
          documentNumber: `RCP-${orderNumber.replace("DT-", "")}`,
          data: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            subtotalCents: order.subtotalCents,
            paymentStatus: order.paymentStatus,
            totalPaidCents,
            balanceDueCents,
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
      const msg = `Hi ${customerName}, here is your receipt for order ${orderNumber}.\n\nView it here: ${shareUrl}\n\nThank you for choosing FusionZone!`;
      const customerPhone = formatPhone(order?.customerPhone || "");
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

  const handleSendViaEmail = async (orderNumber: string, recipientEmail: string) => {
    const order = paidOrders.find((o) => o.orderNumber === orderNumber);
    if (!order) return;
    setSending(orderNumber);
    setShowEmailInput(false);
    try {
      // Generate a share token with data snapshot
      const orderPayments = payments.filter((payment) => payment.orderNumber === order.orderNumber);
      const { totalPaidCents, balanceDueCents } = computePaymentFields(
        order.subtotalCents,
        order.paymentStatus,
        orderPayments,
        { fulfillmentMethod: order.fulfillmentMethod, courierFeeCents: order.courierFeeCents },
      );

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
          referenceId: orderNumber,
          documentNumber: `RCP-${orderNumber.replace("DT-", "")}`,
          data: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            subtotalCents: order.subtotalCents,
            paymentStatus: order.paymentStatus,
            totalPaidCents,
            balanceDueCents,
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
      const settings = useDashboardStore.getState().settings;

      // Try sending via the send-email API with PDF attachment
      try {
        const emailRes = await fetch("/api/documents/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentType: "receipt",
            recipientEmail,
            recipientName: order.customerName,
            documentNumber: `RCP-${orderNumber.replace("DT-", "")}`,
            subject: `Receipt for ${orderNumber} - ${settings?.storeName || "FusionZone"}`,
            messageBody: `Your receipt for ${orderNumber} is attached.`,
            shareUrl,
            orderSnapshot: {
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              items: items.length ? items : [{ name: `${order.itemCount} items`, quantity: 1, unitPrice: order.subtotalCents, total: order.subtotalCents }],
              subtotalCents: order.subtotalCents,
              paymentStatus: order.paymentStatus,
              totalPaidCents,
              balanceDueCents,
              createdAt: order.createdAt,
              fulfillmentMethod: order.fulfillmentMethod,
              courierFeeCents: order.courierFeeCents,
              shipping: order.shipping,
            },
          }),
        });
        const emailData = await emailRes.json();
        if (emailData.success) {
          toast.success("Receipt sent with PDF attachment");
          return;
        }
      } catch {
        // Fall through to mailto fallback
      }

      // Fallback: open email client with the share link
      const subject = encodeURIComponent(`Receipt for ${order.orderNumber}`);
      const body = encodeURIComponent(
        `Hi ${order.customerName},\n\nPlease find your receipt for ${order.orderNumber} below.\n\n${shareUrl}\n\nThank you for choosing FusionZone!`,
      );
      window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    } catch (err) {
      console.error("Send via email failed:", err);
      toast.error("Failed to open email client");
    } finally {
      setSending(null);
      setShowSendModal(null);
      setEmailInput("");
    }
  };

  const handleViewPdf = async (orderNumber: string) => {
    const order = paidOrders.find((o) => o.orderNumber === orderNumber);
    if (!order) {
      toast.error("Order not found");
      return;
    }
    setViewingPdf(orderNumber);
    try {
      const orderPayments = payments.filter((payment) => payment.orderNumber === order.orderNumber);
      const { totalPaidCents, balanceDueCents } = computePaymentFields(
        order.subtotalCents,
        order.paymentStatus,
        orderPayments,
        { fulfillmentMethod: order.fulfillmentMethod, courierFeeCents: order.courierFeeCents },
      );

      const items = order.items?.length
        ? order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents,
            total: item.unitPriceCents * item.quantity,
            sku: item.sku,
          }))
        : [];

      // Generate document token with data snapshot
      const res = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "receipt",
          referenceId: orderNumber,
          documentNumber: `RCP-${orderNumber.replace("DT-", "")}`,
          data: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            subtotalCents: order.subtotalCents,
            paymentStatus: order.paymentStatus,
            totalPaidCents,
            balanceDueCents,
            createdAt: order.createdAt,
            fulfillmentMethod: order.fulfillmentMethod,
            courierFeeCents: order.courierFeeCents,
            shipping: order.shipping,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to generate PDF link");
        return;
      }
      // Open the share URL in a new tab (renders PDF inline)
      window.open(data.shortUrl ?? data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("View PDF failed:", err);
      toast.error("Failed to open PDF");
    } finally {
      setViewingPdf(null);
    }
  };

  const handleCopyLink = async (orderNumber: string) => {
    try {
      const order = paidOrders.find((o) => o.orderNumber === orderNumber);
      if (!order) {
        toast.error("Order not found");
        return;
      }
      const orderPayments = payments.filter((payment) => payment.orderNumber === order.orderNumber);
      const { totalPaidCents, balanceDueCents } = computePaymentFields(
        order.subtotalCents,
        order.paymentStatus,
        orderPayments,
        { fulfillmentMethod: order.fulfillmentMethod, courierFeeCents: order.courierFeeCents },
      );

      const items = order.items?.length
        ? order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents,
            total: item.unitPriceCents * item.quantity,
            sku: item.sku,
          }))
        : [];

      // Generate document token with data snapshot
      const res = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "receipt",
          referenceId: orderNumber,
          documentNumber: `RCP-${orderNumber.replace("DT-", "")}`,
          data: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            subtotalCents: order.subtotalCents,
            paymentStatus: order.paymentStatus,
            totalPaidCents,
            balanceDueCents,
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
      await navigator.clipboard.writeText(data.shortUrl ?? data.url);
      setCopiedLink(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Copy link failed:", err);
      toast.error("Failed to copy link");
    }
  };

  const onSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Receipts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {paidOrders.length} receipts available
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by customer, order number, or phone..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {receiptStatuses.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              {s === "all" ? "All" : s === "PaidInFull" ? "Paid" : "Deposit"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center rounded-xl border border-dashed border-border">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">
            {search || statusFilter !== "all" ? "No matching receipts" : "No receipts yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Receipts become available once orders are paid.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((order, i) => (
            <FadeIn key={order.id} delay={i * 0.03}>
            <div
              className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/orders/${order.id}/receipt`}
                        className="text-sm font-semibold text-primary font-mono hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold", getStatusBadgeClass(order.paymentStatus))}>
                        {getStatusLabel(order.paymentStatus)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5 truncate">{order.customerName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatCents(order.subtotalCents)}</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleDownloadPDF(order.orderNumber)}
                    disabled={downloading === order.orderNumber}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    title="Download receipt PDF"
                    aria-label="Download receipt PDF"
                  >
                    {downloading === order.orderNumber ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowSendModal(order.orderNumber)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                    title="Share receipt"
                    aria-label="Share receipt"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleViewPdf(order.orderNumber)}
                    disabled={viewingPdf === order.orderNumber}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    title="Open receipt PDF in browser"
                    aria-label="Open receipt PDF in browser"
                  >
                    {viewingPdf === order.orderNumber ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <Link
                    href={`/dashboard/orders/${order.id}/receipt`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    title="Open receipt details"
                    aria-label="Open receipt details"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
            </FadeIn>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && !showEmailInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSendModal(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-foreground mb-2">Send Receipt</h3>
            <p className="text-xs text-muted-foreground mb-5">Choose how to send the receipt to the customer.</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const order = paidOrders.find((o) => o.orderNumber === showSendModal);
                  if (order) handleSendViaWhatsApp(order.orderNumber, order.customerName);
                  setShowSendModal(null);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-whatsapp/30 hover:bg-whatsapp-soft"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-whatsapp-soft text-whatsapp">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Send via WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Opens WhatsApp with receipt link</p>
                </div>
              </button>
              <button
                onClick={() => setShowEmailInput(true)}
                disabled={sending === showSendModal}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:bg-accent disabled:opacity-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                  {sending === showSendModal ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Send via Email</p>
                  <p className="text-xs text-muted-foreground">{sending === showSendModal ? "Sending..." : "Sends receipt via email"}</p>
                </div>
              </button>
              <button
                onClick={() => {
                  handleCopyLink(showSendModal);
                  setShowSendModal(null);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-border/70 hover:bg-muted"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {copiedLink ? <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <Copy className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{copiedLink ? "Copied!" : "Copy Receipt Link"}</p>
                  <p className="text-xs text-muted-foreground">Copy shareable PDF link to clipboard</p>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowSendModal(null)}
              className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Email input prompt */}
      {showSendModal && showEmailInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowEmailInput(false); setShowSendModal(null); }}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-foreground mb-2">Send via Email</h3>
            <p className="text-xs text-muted-foreground mb-4">Enter the customer's email address to send the receipt PDF.</p>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="customer@example.com"
              autoFocus
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              onKeyDown={(e) => { if (e.key === "Enter") handleSendViaEmail(showSendModal, emailInput); if (e.key === "Escape") { setShowEmailInput(false); setEmailInput(""); }}}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleSendViaEmail(showSendModal, emailInput)}
                disabled={!emailInput || sending === showSendModal}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {sending === showSendModal ? "Sending..." : "Send Receipt"}
              </button>
              <button
                onClick={() => { setShowEmailInput(false); setEmailInput(""); }}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
