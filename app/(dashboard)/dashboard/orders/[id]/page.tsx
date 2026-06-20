"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  User,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Trash2,
  AlertTriangle,
  Plus,
  Banknote,
  FileText,
} from "lucide-react";
import { useDashboardStore } from "@/lib/store/dashboard";
import { cn } from "@/lib/utils";
import {
  getStatusBadgeClass,
  getStatusLabel,
  formatCents,
  computePaymentFields,
} from "@/lib/dashboard-data";
import { formatPhone } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";
import type {
  DashboardOrder,
  OrderContactStatus,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
} from "@/lib/dashboard-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { motionTransition, statusVariants } from "@/lib/motion";

const CONTACT_ORDER: OrderContactStatus[] = ["NotContacted", "Contacted"];
const PAYMENT_ORDER: OrderPaymentStatus[] = ["Unpaid", "DepositPaid", "PaidInFull"];
const FULFILLMENT_ORDER: OrderFulfillmentStatus[] = ["Pending", "ReadyForCollection", "Completed"];

const PAYMENT_METHODS = ["BankTransfer", "Cash", "PhoneTransfer", "Card", "Other"] as const;

function stageStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NotContacted: "Pending Contact",
    Contacted: "Contacted",
    Unpaid: "Awaiting Payment",
    DepositPaid: "Deposit Paid",
    PaidInFull: "Paid in Full",
    Pending: "Processing",
    ReadyForCollection: "Ready for Collection",
    Completed: "Completed",
    Cancelled: "Cancelled",
  };
  return labels[status] ?? getStatusLabel(status);
}

interface TimelineEntry {
  stage: string;
  status: string;
  label: string;
  timestamp: string;
  icon: typeof CheckCircle2;
  iconClass: string;
  active: boolean;
}

function buildTimeline(order: DashboardOrder): TimelineEntry[] {
  return [
    {
      stage: "Contact",
      status: order.contactStatus,
      label: stageStatusLabel(order.contactStatus),
      timestamp: order.contactStatusAt || order.createdAt,
      icon: order.contactStatus === "Contacted" ? CheckCircle2 : Clock,
      iconClass:
        order.contactStatus === "Contacted"
          ? "text-success bg-success-soft"
          : "text-muted-foreground bg-gray-100",
      active: order.contactStatus === "Contacted",
    },
    {
      stage: "Payment",
      status: order.paymentStatus,
      label: stageStatusLabel(order.paymentStatus),
      timestamp: order.paymentStatusAt || order.createdAt,
      icon:
        order.paymentStatus === "PaidInFull"
          ? CheckCircle2
          : order.paymentStatus === "DepositPaid"
            ? Clock
            : XCircle,
      iconClass:
        order.paymentStatus === "PaidInFull"
          ? "text-success bg-success-soft"
          : order.paymentStatus === "DepositPaid"
            ? "text-warning bg-warning-soft"
            : "text-muted-foreground bg-gray-100",
      active: order.paymentStatus !== "Unpaid",
    },
    {
      stage: "Fulfillment",
      status: order.fulfillmentStatus,
      label: stageStatusLabel(order.fulfillmentStatus),
      timestamp: order.fulfillmentStatusAt || order.createdAt,
      icon:
        order.fulfillmentStatus === "Completed"
          ? CheckCircle2
          : order.fulfillmentStatus === "Cancelled"
            ? XCircle
            : Clock,
      iconClass:
        order.fulfillmentStatus === "Completed"
          ? "text-success bg-success-soft"
          : order.fulfillmentStatus === "Cancelled"
            ? "text-destructive bg-destructive/10"
            : order.fulfillmentStatus === "ReadyForCollection"
              ? "text-info bg-info-soft"
              : "text-muted-foreground bg-gray-100",
      active:
        order.fulfillmentStatus !== "Pending" && order.fulfillmentStatus !== "Cancelled",
    },
  ];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const order = useDashboardStore((s) => s.orders.find((o) => o.id === orderId));
  const payments = useDashboardStore((s) => s.payments);
  const updateContactStatus = useDashboardStore((s) => s.updateOrderContactStatus);
  const updatePaymentStatus = useDashboardStore((s) => s.updateOrderPaymentStatus);
  const updateFulfillmentStatus = useDashboardStore((s) => s.updateOrderFulfillmentStatus);
  const resetOrderStatuses = useDashboardStore((s) => s.resetOrderStatuses);
  const deleteOrderFromStore = useDashboardStore((s) => s.deleteOrder);
  const addPayment = useDashboardStore((s) => s.addPayment);
  const addNotification = useDashboardStore((s) => s.addNotification);
  const customers = useDashboardStore((s) => s.customers);
  const addCustomer = useDashboardStore((s) => s.addCustomer);
  const deleteCustomer = useDashboardStore((s) => s.deleteCustomer);
  const storeSettings = useDashboardStore((s) => s.settings);
  const reducedMotion = useReducedMotion();

  if (!order) notFound();

  const existingCustomer = customers.find(
    (c) =>
      c.fullName.toLowerCase() === order.customerName.toLowerCase() &&
      c.phone === order.customerPhone,
  );

  const handleToggleCustomer = () => {
    if (existingCustomer) {
      deleteCustomer(existingCustomer.id);
      toast.success(`${existingCustomer.fullName} removed from customers`);
    } else {
      addCustomer({
        fullName: order.customerName.trim(),
        phone: order.customerPhone.trim(),
        preferredContact: Array.isArray(order.preferredContact) && order.preferredContact.length > 0 ? order.preferredContact : ["WhatsApp"],
      });
      toast.success(`${order.customerName} added to customers`);
    }
  };

  const orderPayments = payments.filter((p) => p.orderNumber === order.orderNumber);
  const { totalPaidCents, balanceDueCents: balanceCents } = computePaymentFields(
    order.subtotalCents,
    order.paymentStatus,
    orderPayments,
  );

  const timeline = buildTimeline(order);

  const contactDone = order.contactStatus === "Contacted";
  const paymentStarted = order.paymentStatus !== "Unpaid";
  const paymentDone = order.paymentStatus === "PaidInFull";
  const isCancelled = order.fulfillmentStatus === "Cancelled";
  const isCompleted = order.fulfillmentStatus === "Completed";

  const canChangePayment = contactDone && !isCancelled && !isCompleted;
  const canChangeFulfillment = paymentStarted && !isCancelled && !isCompleted;
  const canCancel = !isCancelled && !isCompleted;
  const canRestore = isCancelled;

  // Confirmation state
  const [confirmAction, setConfirmAction] = useState<"cancel" | "delete" | "restore" | null>(null);

  // Helper: generate a shareable receipt link for WhatsApp
  const generateReceiptLink = async (order: DashboardOrder): Promise<string | null> => {
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
          documentNumber: `RCP-${order.orderNumber.replace("DT-", "")}`,
          data: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            subtotalCents: order.subtotalCents,
            paymentStatus: order.paymentStatus,
            totalPaidCents: 0,
            balanceDueCents: order.subtotalCents,
            createdAt: order.createdAt,
            fulfillmentMethod: order.fulfillmentMethod,
            courierFeeCents: order.courierFeeCents,
            shipping: order.shipping,
          },
        }),
      });
      const data = await res.json();
      return data.shortUrl ?? data.url ?? null;
    } catch {
      return null;
    }
  };

  // Email receipt state
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Record Payment dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmountCents, setPaymentAmountCents] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("BankTransfer");
  const [paymentNote, setPaymentNote] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const handleContactChange = (value: string) => {
    updateContactStatus(order.id, value as OrderContactStatus);
    toast.success(`Customer contact: ${stageStatusLabel(value)}`);
  };

  const handlePaymentChange = (value: string) => {
    updatePaymentStatus(order.id, value as OrderPaymentStatus);
    toast.success(`Payment: ${stageStatusLabel(value)}`);
  };

  const handleFulfillmentChange = (value: string) => {
    updateFulfillmentStatus(order.id, value as OrderFulfillmentStatus);
    toast.success(`Fulfillment: ${stageStatusLabel(value)}`);
  };

  const handleCancel = () => {
    updateFulfillmentStatus(order.id, "Cancelled");
    setConfirmAction(null);
    addNotification({
      type: "order",
      title: "Order Cancelled",
      message: `Order ${order.orderNumber} was cancelled.`,
    });
    toast.success(`Order ${order.orderNumber} cancelled`);
  };

  const handleDelete = () => {
    deleteOrderFromStore(order.id);
    setConfirmAction(null);
    toast.success(`Order ${order.orderNumber} deleted`);
    router.push("/dashboard/orders");
  };

  const handleRestore = () => {
    resetOrderStatuses(order.id);
    setConfirmAction(null);
    addNotification({
      type: "order",
      title: "Order Restored",
      message: `Order ${order.orderNumber} has been restored.`,
    });
    toast.success(`Order ${order.orderNumber} restored`);
  };

  const handleSendEmail = async (email?: string) => {
    const recipientEmail = email || emailInput;
    if (!recipientEmail) {
      setShowEmailInput(true);
      return;
    }
    setSendingEmail(true);
    setShowEmailInput(false);
    // Compute payment status locally (can't rely on outer scope hoisting)
    const orderIsPaidInFull = order.paymentStatus === "PaidInFull" || (balanceCents <= 0 && order.paymentStatus !== "Unpaid");
    const orderIsDepositPaid = order.paymentStatus === "DepositPaid";
    try {
      // Build order snapshot data
      const items = order.items?.length
        ? order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents,
            total: item.unitPriceCents * item.quantity,
            sku: item.sku,
          }))
        : [{ name: `${order.itemCount} items`, quantity: order.itemCount, unitPrice: Math.round(order.subtotalCents / order.itemCount), total: order.subtotalCents }];

      // Generate share token
      const tokenRes = await fetch("/api/documents/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "receipt",
          referenceId: order.orderNumber,
          documentNumber: `RCP-${order.orderNumber.replace("DT-", "")}`,
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

      // Send via the send-email API with PDF attachment
      const emailRes = await fetch("/api/documents/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "receipt",
          recipientEmail,
          recipientName: order.customerName,
          documentNumber: `RCP-${order.orderNumber.replace("DT-", "")}`,
          subject: `Receipt for ${order.orderNumber} - ${storeSettings?.storeName || "FusionZone"}`,
          messageBody: `Please find your receipt for ${order.orderNumber} attached.`,
          shareUrl,
          orderSnapshot: {
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
      const emailData = await emailRes.json();
      if (emailData.success) {
        toast.success("Receipt sent via email with PDF attachment");
      } else {
        // Fallback: open email client
        const paymentLine = orderIsDepositPaid
          ? `Paid: ${formatCents(totalPaidCents)}, Balance due: ${formatCents(balanceCents)}`
          : orderIsPaidInFull
            ? "Paid in full."
            : `Payment status: ${getStatusLabel(order.paymentStatus)}`;
        const subject = encodeURIComponent(`Receipt for ${order.orderNumber} - ${storeSettings?.storeName || "FusionZone"}`);
        const body = encodeURIComponent(
          `Hi ${order.customerName},\n\nPlease find your receipt for ${order.orderNumber} below.\n\n${shareUrl}\n\nTotal: ${formatCents(order.subtotalCents)}\n${paymentLine}\n\nThank you for your business!`,
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

  const handleRecordPayment = () => {
    const amount = paymentAmountCents;
    if (!amount || amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (amount > balanceCents && !paymentDone) {
      toast.warning("Amount exceeds the balance — order will be marked as paid in full.");
    }
    setSubmittingPayment(true);

    const isFullPayment = amount >= balanceCents;
    const newStatus: OrderPaymentStatus = isFullPayment ? "PaidInFull" : "DepositPaid";

    addPayment({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      amountCents: amount,
      method: paymentMethod,
      status: "Confirmed",
      note: paymentNote || undefined,
    });

    updatePaymentStatus(order.id, newStatus);
    addNotification({
      type: "payment",
      title: isFullPayment ? "Payment Received" : "Deposit Received",
      message: `${formatCents(amount)} received for ${order.orderNumber}${paymentNote ? ` — ${paymentNote}` : ""}`,
    });

    setSubmittingPayment(false);
    setShowPaymentDialog(false);
    setPaymentAmountCents(0);
    setPaymentMethod("BankTransfer");
    setPaymentNote("");
    toast.success(`Payment of ${formatCents(amount)} recorded`);
  };

  const contactIcon = () => {
    const prefs = Array.isArray(order.preferredContact) ? order.preferredContact : [order.preferredContact];
    if (prefs.includes("WhatsApp")) return <MessageCircle className="h-4 w-4 text-whatsapp" />;
    if (prefs.includes("Phone")) return <Phone className="h-4 w-4 text-blue-600" />;
    if (prefs.includes("Email")) return <Mail className="h-4 w-4 text-blue-600" />;
    return <Phone className="h-4 w-4" />;
  };

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Orders
        </Link>
        <div className="flex items-center gap-1.5">
          {canCancel && (
            <button
              onClick={() => setConfirmAction("cancel")}
              className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
          {canRestore && (
            <button
              onClick={() => setConfirmAction("restore")}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              Restore
            </button>
          )}
          <button
            onClick={() => handleSendEmail()}
            disabled={sendingEmail}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
          >
            {sendingEmail ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            ) : (
              <Mail className="h-3.5 w-3.5" />
            )}
            Email Receipt
          </button>
          <Link
            href={`/dashboard/orders/${order.id}/receipt`}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Receipt
          </Link>
          <button
            onClick={() => setConfirmAction("delete")}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Order header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {order.orderNumber}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </p>
        </div>
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", getStatusBadgeClass(order.fulfillmentStatus))}>
          {stageStatusLabel(order.fulfillmentStatus)}
        </span>
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <XCircle className="h-4 w-4" />
            This order has been cancelled
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left column: Customer + Order Summary (3/5 width) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Combined Customer + Order card */}
          <div className="rounded-xl border border-border bg-card">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Customer
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {contactIcon()}
                <span>{Array.isArray(order.preferredContact) ? order.preferredContact.join(", ") : order.preferredContact}</span>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                  <p className="text-sm font-medium text-foreground">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                  <a href={`tel:${order.customerPhone}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {order.customerPhone}
                  </a>
                </div>
              </div>
              {/* Customer toggle */}
              <div className="mt-4">
                <button
                  onClick={handleToggleCustomer}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    existingCustomer
                      ? "border-border text-muted-foreground hover:text-destructive hover:border-destructive/30"
                      : "border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  <User className="h-3.5 w-3.5" />
                  {existingCustomer ? "Remove from Customers" : "Save to Customers"}
                </button>
              </div>
              {/* Quick contact buttons */}
              <div className="flex gap-2 mt-4">
              <button
                onClick={async () => {
                  try {
                    const shareUrl = await generateReceiptLink(order);
                    if (!shareUrl) { toast.error("Failed to generate shareable link"); return; }
                    const msg = `Hi ${order.customerName},\n\nYour order ${order.orderNumber} has been created.\n\nView receipt: ${shareUrl}\n\nTotal: ${formatCents(order.subtotalCents)}\n\nThank you for choosing ${storeSettings?.storeName || "FusionZone"}!`;
                    const a = document.createElement("a");
                    a.href = buildWhatsAppUrl(order.customerPhone, msg);
                    a.target = "_blank";
                    a.rel = "noopener,noreferrer";
                    a.click();
                  } catch { toast.error("Failed to generate link"); }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-whatsapp/20 bg-whatsapp-soft px-3 py-1.5 text-xs font-semibold text-whatsapp hover:bg-whatsapp hover:text-white transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </button>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Order Summary */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold text-foreground">{formatCents(order.subtotalCents)}</span>
              </div>

              {/* Fulfillment / Shipping info */}
            {(order.fulfillmentMethod === "courier" || order.courierFeeCents) && (
              <div className="rounded-lg bg-muted/30 p-3 space-y-2 border border-border/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  {order.fulfillmentMethod === "courier" ? "Courier Delivery" : "Fulfillment"}
                </div>
                {order.courierFeeCents ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Courier Fee</span>
                    <span className="font-semibold text-foreground">{formatCents(order.courierFeeCents)}</span>
                  </div>
                ) : null}
                {order.fulfillmentMethod === "collection" ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Collection</span>
                    <span className="font-semibold text-success">Free</span>
                  </div>
                ) : null}
                {order.shipping && (
                  <div className="border-t border-border/50 pt-2 mt-1 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shipping Address</p>
                    <p className="text-xs text-foreground">{order.shipping.recipientName}</p>
                    <p className="text-xs text-muted-foreground">{order.shipping.phone}</p>
                    <p className="text-xs text-muted-foreground">{order.shipping.address}</p>
                    <p className="text-xs text-muted-foreground">{order.shipping.city}, {order.shipping.region}</p>
                    {order.shipping.deliveryNotes && (
                      <p className="text-xs text-muted-foreground italic">Note: {order.shipping.deliveryNotes}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Payment progress */}
              {paymentStarted && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-semibold text-success">{formatCents(totalPaidCents)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Balance</span>
                    <span className={cn("font-semibold", balanceCents <= 0 ? "text-success" : "text-destructive")}>
                      {balanceCents <= 0 ? "Paid in Full" : formatCents(balanceCents)}
                    </span>
                  </div>
                  {/* Payment records */}
                  {orderPayments.length > 0 && (
                    <div className="border-t border-border pt-2 mt-2 space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payments</p>
                      {orderPayments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <Banknote className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{p.method}</span>
                          </div>
                          <span className="font-medium text-foreground">{formatCents(p.amountCents)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Stage controls (2/5 width) */}
        <div className="lg:col-span-2 space-y-3">
          {/* Step 1: Contact */}
          <div className={cn("rounded-lg border bg-card", !contactDone ? "border-primary/30" : "border-border")}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
              <div className={cn("flex h-5 w-5 items-center justify-center rounded-full", contactDone ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
                {contactDone ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              </div>
              <span className="text-xs font-semibold text-foreground">1. Customer Contact</span>
              <span className={cn("ml-auto inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium", getStatusBadgeClass(order.contactStatus))}>
                {stageStatusLabel(order.contactStatus)}
              </span>
            </div>
            <div className="p-3">
              <Select value={order.contactStatus} onValueChange={handleContactChange} disabled={isCancelled || isCompleted}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_ORDER.map((s) => (
                    <SelectItem key={s} value={s} disabled={s === "NotContacted" && paymentStarted}>
                      {stageStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Confirm the customer has been reached before taking payment.
              </p>
            </div>
          </div>

          {/* Step 2: Payment */}
          <div className={cn("rounded-lg border bg-card", !contactDone ? "opacity-50" : !paymentDone ? "border-primary/30" : "border-border")}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
              <div className={cn("flex h-5 w-5 items-center justify-center rounded-full", paymentDone ? "bg-success-soft text-success" : paymentStarted ? "bg-warning-soft text-warning" : "bg-gray-100 text-muted-foreground")}>
                {paymentDone ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              </div>
              <span className="text-xs font-semibold text-foreground">2. Payment</span>
              <span className={cn("ml-auto inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium", getStatusBadgeClass(order.paymentStatus))}>
                {stageStatusLabel(order.paymentStatus)}
              </span>
            </div>
            <div className="p-3 space-y-2">
              <Select value={order.paymentStatus} onValueChange={handlePaymentChange} disabled={!canChangePayment}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_ORDER.map((s) => (
                    <SelectItem key={s} value={s} disabled={s === "Unpaid" && order.fulfillmentStatus !== "Pending"}>
                      {stageStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Record Payment button — only when DepositPaid */}
              {order.paymentStatus === "DepositPaid" && (
                <>
                  <button
                    onClick={() => setShowPaymentDialog(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-warning/20 bg-warning-soft px-3 py-2 text-xs font-medium text-warning hover:bg-warning hover:text-white transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Record Payment
                  </button>

                  {/* Show balance due */}
                  <div className="flex items-center justify-between text-xs bg-muted/40 rounded-md px-3 py-2">
                    <span className="text-muted-foreground">Balance due</span>
                    <span className="font-semibold text-destructive">{formatCents(balanceCents)}</span>
                  </div>
                </>
              )}
              {!contactDone && (
                <p className="text-[11px] text-muted-foreground">Complete customer contact to unlock payment.</p>
              )}
            </div>
          </div>

          {/* Step 3: Fulfillment */}
          <div className={cn("rounded-lg border bg-card", !paymentStarted ? "opacity-50" : order.fulfillmentStatus === "Completed" ? "border-success/30" : order.fulfillmentStatus === "Cancelled" ? "border-destructive/30" : "border-primary/30")}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
              <div className={cn("flex h-5 w-5 items-center justify-center rounded-full", order.fulfillmentStatus === "Completed" ? "bg-success-soft text-success" : order.fulfillmentStatus === "Cancelled" ? "bg-destructive/10 text-destructive" : order.fulfillmentStatus === "ReadyForCollection" ? "bg-info-soft text-info" : "bg-gray-100 text-muted-foreground")}>
                {order.fulfillmentStatus === "Completed" ? <CheckCircle2 className="h-3 w-3" /> : order.fulfillmentStatus === "Cancelled" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              </div>
              <span className="text-xs font-semibold text-foreground">3. Fulfillment</span>
              <span className={cn("ml-auto inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium", getStatusBadgeClass(order.fulfillmentStatus))}>
                {stageStatusLabel(order.fulfillmentStatus)}
              </span>
            </div>
            <div className="p-3">
              <Select value={order.fulfillmentStatus} onValueChange={handleFulfillmentChange} disabled={!canChangeFulfillment || isCancelled}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FULFILLMENT_ORDER.map((s) => (
                    <SelectItem key={s} value={s} disabled={s === "Pending" && isCompleted}>
                      {stageStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {!paymentStarted ? "Record a payment or deposit to unlock fulfillment." : "Move the order from processing to collection, then complete it."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            Timeline
          </h2>
        </div>
        <div className="p-5">
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-5">
              {timeline.map((entry) => (
                <motion.div
                  key={`${entry.stage}-${entry.status}`}
                  variants={statusVariants}
                  initial="hidden"
                  animate="visible"
                  transition={motionTransition(reducedMotion)}
                  className="relative flex gap-3"
                >
                  <div className="relative z-10 flex-shrink-0">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border border-border", entry.iconClass)}>
                      <entry.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{entry.stage}</span>
                      <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium", getStatusBadgeClass(entry.status))}>
                        {entry.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {entry.active
                        ? entry.stage === "Contact"
                          ? "Customer contacted."
                          : entry.stage === "Payment"
                            ? entry.status === "PaidInFull"
                              ? "Paid in full."
                              : "Deposit received."
                            : entry.status === "Completed"
                              ? "Order completed."
                              : entry.status === "ReadyForCollection"
                                ? "Ready for collection."
                                : "Pending."
                        : entry.stage === "Contact"
                          ? "Not yet contacted."
                          : entry.stage === "Payment"
                            ? "Not yet reached."
                            : "Not yet reached."}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          {order.timelineEvents && order.timelineEvents.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Recent activity</p>
              <AnimatePresence initial={false}>
                {order.timelineEvents.slice(0, 5).map((event) => (
                  <motion.div
                    key={event.id}
                    variants={statusVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={motionTransition(reducedMotion, 0.18)}
                    className="flex items-center justify-between gap-3 border-t border-border/60 py-2 first:border-t-0"
                  >
                    <p className="text-xs text-foreground">
                      <span className="font-semibold">{event.stage}:</span> {event.label}
                    </p>
                    <time className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString("en-NA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Email input prompt */}
      {showEmailInput && (
        <div className="rounded-xl border border-border bg-card p-4">
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

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-primary" />
              Record Payment
            </DialogTitle>
            <DialogDescription className="text-sm">
              {order.orderNumber} &mdash; {formatCents(order.subtotalCents)} total
              {paymentStarted && <span className="ml-1">(&minus;{formatCents(totalPaidCents)} paid = <strong className="text-destructive">{formatCents(balanceCents)} due</strong>)</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="pay-amount" className="text-xs">Amount</Label>
              <MoneyInput
                id="pay-amount"
                value={paymentAmountCents}
                onChange={setPaymentAmountCents}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pay-method" className="text-xs">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="pay-method" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m === "BankTransfer" ? "Bank Transfer" : m === "PhoneTransfer" ? "Phone Transfer" : m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pay-note" className="text-xs">Note (optional)</Label>
              <input
                id="pay-note"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="e.g. Deposit via Standard Bank"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <button
              onClick={handleRecordPayment}
              disabled={submittingPayment || paymentAmountCents <= 0}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingPayment ? "Recording..." : `Record ${formatCents(paymentAmountCents)}`}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={confirmAction === "cancel"}
        onOpenChange={() => setConfirmAction(null)}
        title="Cancel this order?"
        description={`The order ${order.orderNumber} will be marked as cancelled and may no longer be processed. This can be undone.`}
        confirm={{ label: "Cancel Order", onClick: handleCancel, variant: "warning" }}
      />
      <ConfirmDialog
        open={confirmAction === "delete"}
        onOpenChange={() => setConfirmAction(null)}
        title="Delete order?"
        description={`This will permanently delete ${order.orderNumber} and all associated payment records. This action cannot be undone.`}
        confirm={{ label: "Delete Order", onClick: handleDelete, variant: "danger" }}
      />
      <ConfirmDialog
        open={confirmAction === "restore"}
        onOpenChange={() => setConfirmAction(null)}
        title="Restore this order?"
        description={`The order ${order.orderNumber} will be restored. Status will be reset to Not Contacted / Unpaid / Pending.`}
        confirm={{ label: "Restore Order", onClick: handleRestore }}
      />
    </div>
  );
}
