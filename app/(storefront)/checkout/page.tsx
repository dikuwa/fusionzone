"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShoppingBag,
  ArrowLeft,
  MessageCircle,
  Phone,
  Check,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/store/cart";
import { formatNAD } from "@/lib/data";

// Fulfillment options
type FulfillmentMethod = "collection" | "courier";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/product-image";
import { useDashboardStore } from "@/lib/store/dashboard";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";

const CONTACT_METHODS = ["WhatsApp", "Phone", "Email"] as const;
type ContactMethod = (typeof CONTACT_METHODS)[number];

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  phone: z.string().min(5, "Phone number is required").max(20),
  whatsapp: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  preferredContact: z.array(z.enum(CONTACT_METHODS)).min(1, "Select at least one contact method"),
  notes: z.string().max(500).optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 text-center text-muted-foreground">
        <div className="inline-block animate-pulse rounded-full h-8 w-8 bg-muted-foreground/20 mb-4"></div>
        <div className="mx-auto h-4 w-48 animate-pulse rounded bg-muted-foreground/10 mb-2"></div>
        <div className="mx-auto h-3 w-64 animate-pulse rounded bg-muted-foreground/10"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("collection");
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingRegion, setShippingRegion] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [courierFeeCents, setCourierFeeCents] = useState(0);

  const settings = useDashboardStore((s) => s.settings);
  const contactDetails = useDashboardStore((s) => s.contactDetails);
  const paymentMethods = useDashboardStore((s) => s.paymentMethods);
  const bankDetails = useDashboardStore((s) => s.bankDetails);
  const whatsapp = settings.whatsapp || "264000000000";
  const phone = settings.phone || "+264000000000";
  const activePayments = paymentMethods.filter((p) => p.isActive);
  const activeBanks = bankDetails.filter((b) => b.isActive);
  const subtotal = getSubtotal();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      preferredContact: ["WhatsApp"],
    },
  });

  const preferredContact = watch("preferredContact");

  const toggleContactMethod = (method: "WhatsApp" | "Phone" | "Email") => {
    const current = preferredContact || [];
    if (current.includes(method)) {
      setValue("preferredContact", current.filter((m) => m !== method), { shouldValidate: true });
    } else {
      setValue("preferredContact", [...current, method], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          phone: data.phone,
          whatsapp: data.whatsapp || data.phone,
          email: data.email || undefined,
          preferredContact: data.preferredContact,
          notes: data.notes || undefined,
          fulfillmentMethod,
          courierFeeCents: fulfillmentMethod === "courier" ? courierFeeCents : 0,
          shipping: fulfillmentMethod === "courier" ? {
            recipientName: shippingName || data.fullName,
            phone: shippingPhone || data.phone,
            address: shippingAddress,
            city: shippingCity,
            region: shippingRegion,
            deliveryNotes: deliveryNotes || undefined,
          } : undefined,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            slug: i.slug,
            priceCents: i.priceCents,
            quantity: i.quantity,
            specs: i.specs,
          })),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to submit order");
      }

      const result = await response.json();
      const order = result.order;

      // Store order data in sessionStorage for the success page
      sessionStorage.setItem("lastOrder", JSON.stringify(order));

      toast.success(`Order ${order.orderNumber} submitted! We'll be in touch.`);
      clearCart();
      router.push(`/order-success/${order.orderNumber}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Nothing to checkout</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            Add some products to your cart first, then come back here to submit your order request.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <Link
          href="/cart"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Checkout</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Submit your order request and we&apos;ll contact you to confirm.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact Information */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <h2 className="text-base font-semibold text-foreground">Contact Information</h2>

              <div>
                <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="fullName"
                  autoComplete="name"
                  {...register("fullName")}
                  className={cn(
                    "mt-1.5 h-11 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1",
                    errors.fullName
                      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                      : "border-border focus:border-primary focus:ring-primary/30",
                  )}
                  placeholder="Your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Phone Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="phone"
                    autoComplete="tel"
                    type="tel"
                    {...register("phone")}
                    className={cn(
                      "mt-1.5 h-11 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1",
                      errors.phone
                        ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                        : "border-border focus:border-primary focus:ring-primary/30",
                    )}
                    placeholder="+264 81 234 5678"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="whatsapp" className="text-sm font-medium text-foreground">WhatsApp Number</label>
                  <input
                    id="whatsapp"
                    autoComplete="tel-local"
                    {...register("whatsapp")}
                    className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                    placeholder="Same as phone if not specified"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email (optional)</label>
                <input
                  id="email"
                  autoComplete="email"
                  type="email"
                  {...register("email")}
                  className={cn(
                    "mt-1.5 h-11 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1",
                    errors.email
                      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                      : "border-border focus:border-primary focus:ring-primary/30",
                  )}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Preferred Contact */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground">Preferred Contact Method</h2>
              <p className="text-xs text-muted-foreground">Select one or more methods</p>
              <div className="grid grid-cols-3 gap-3">
                {(["WhatsApp", "Phone", "Email"] as const).map((method) => {
                  const isSelected = (preferredContact || []).includes(method);
                  return (
                    <label
                      key={method}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                        isSelected
                          ? "border-primary bg-accent text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleContactMethod(method)}
                        className="sr-only"
                      />
                      {method === "WhatsApp" ? (
                        <MessageCircle className="h-5 w-5" />
                      ) : method === "Phone" ? (
                        <Phone className="h-5 w-5" />
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      <span className="text-xs font-semibold">{method}</span>
                      {isSelected && (
                        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Fulfillment Method */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Delivery Method
              </h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod("collection")}
                  className={cn(
                    "flex-1 rounded-xl border-2 p-4 text-left transition-all",
                    fulfillmentMethod === "collection"
                      ? "border-primary bg-accent/50"
                      : "border-border hover:border-muted-foreground/30",
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">Collection at Store</p>
                  <p className="text-xs text-muted-foreground mt-1">Free &mdash; Windhoek</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod("courier")}
                  className={cn(
                    "flex-1 rounded-xl border-2 p-4 text-left transition-all",
                    fulfillmentMethod === "courier"
                      ? "border-primary bg-accent/50"
                      : "border-border hover:border-muted-foreground/30",
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">Courier Delivery</p>
                  <p className="text-xs text-muted-foreground mt-1">Nationwide &mdash; fee applies</p>
                </button>
              </div>

              {fulfillmentMethod === "courier" && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-foreground">Shipping Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Recipient Name</label>
                      <input value={shippingName} onChange={e => setShippingName(e.target.value)} placeholder="Full name" className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Phone Number</label>
                      <input value={shippingPhone} onChange={e => setShippingPhone(e.target.value)} placeholder="+264 81 234 5678" className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground">Street Address</label>
                      <input value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} placeholder="Street name, house/building number" className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Town / City</label>
                      <input value={shippingCity} onChange={e => setShippingCity(e.target.value)} placeholder="e.g. Windhoek" className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Region</label>
                      <input value={shippingRegion} onChange={e => setShippingRegion(e.target.value)} placeholder="e.g. Khomas" className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground">Courier Fee (NAD)</label>
                      <input type="number" value={courierFeeCents ? courierFeeCents / 100 : ""} onChange={e => setCourierFeeCents((parseFloat(e.target.value) || 0) * 100)} placeholder="0 — leave blank if unsure" className="mt-1 h-10 w-full max-w-[200px] rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground">Delivery Notes (optional)</label>
                      <input value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} placeholder="Instructions, landmarks, etc." className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">
                Additional Notes (optional)
              </h2>
              <textarea
                id="notes"
                autoComplete="off"
                {...register("notes")}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Collection preferences, questions, or any other details..."
              />
            </div>

            {/* Payment Information */}
            <div className="rounded-xl border border-border bg-accent/50 p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Payment Information</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We accept the following payment methods. We&apos;ll confirm details when we contact you.
                  </p>
                  {activePayments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activePayments.map((pm) => (
                        <span
                          key={pm.id}
                          className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-foreground"
                        >
                          {pm.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {activeBanks.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                      {activeBanks.map((b) => (
                        <p key={b.id} className="text-[10px] text-muted-foreground">
                          {b.bankName}: {b.accountName} &middot; {b.accountNumber}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error */}
            {submitError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                {submitError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Submit Order Request
                </>
              )}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              By submitting, you agree that we&apos;ll contact you using your selected method(s) to
              confirm your order.
            </p>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground">Order Summary</h2>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-border">
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.name}
                      showFallbackText={false}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {formatNAD(item.priceCents * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{formatNAD(subtotal)}</span>
              </div>
              {fulfillmentMethod === "collection" ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Collection</span>
                  <span className="font-semibold text-success">Free</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Courier Fee</span>
                  <span className="font-semibold text-foreground">{formatNAD(courierFeeCents)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex items-center justify-between">
                <span className="text-base font-bold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">{formatNAD(subtotal + courierFeeCents)}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <a
                href={buildWhatsAppUrl(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-whatsapp/20 bg-whatsapp-soft px-4 py-2.5 text-sm font-semibold text-whatsapp transition-all hover:-translate-y-0.5 hover:border-whatsapp/30 hover:bg-whatsapp hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
              <a
                href={`tel:${phone}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
