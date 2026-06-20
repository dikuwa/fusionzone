"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  MessageCircle,
  Phone,
  ShoppingBag,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatNAD } from "@/lib/data";
import { useDashboardStore } from "@/lib/store/dashboard";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";

interface OrderData {
  orderNumber: string;
  fullName: string;
  phone: string;
  preferredContact: string;
  itemCount: number;
  subtotal: number;
  items: { name: string; quantity: number; priceCents: number }[];
  createdAt: string;
}

export default function OrderSuccessPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const contactDetails = useDashboardStore((s) => s.contactDetails);
  const activeContacts = contactDetails.filter((c) => c.isActive);
  const settings = useDashboardStore((s) => s.settings);
  const whatsappContact = activeContacts.find((c) => c.type === "whatsapp");
  const phoneContact = activeContacts.find((c) => c.type === "phone");
  const whatsapp = whatsappContact?.value || settings.whatsapp || "264000000000";
  const phone = phoneContact?.value || settings.phone || "+264000000000";
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("lastOrder");
    if (stored) {
      try {
        const data = JSON.parse(stored) as OrderData;
        if (data.orderNumber === orderNumber) {
          setOrder(data);
        }
      } catch {
        // ignore
      }
    }
    setLoading(false);
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="h-8 w-48 mx-auto rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  const shareMessage = encodeURIComponent(
    `I've placed an order (${orderNumber}) with FusionZone. Looking forward to your response!`,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-success-soft mb-6">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Order Submitted!
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Thank you, {order?.fullName || "customer"}. We&apos;ve received your order request.
        </p>
      </div>

      {/* Order Number */}
      <div className="rounded-xl border border-border bg-card p-6 text-center mb-6">
        <p className="text-sm text-muted-foreground mb-1">Order Reference</p>
        <p className="text-2xl font-bold tracking-wider text-foreground font-mono">
          {orderNumber}
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Please quote this reference when contacting us.
        </p>
      </div>

      {/* Order Summary */}
      {order && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-6">
          <h2 className="text-base font-semibold text-foreground">Order Summary</h2>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {item.name}{" "}
                  <span className="text-muted-foreground">x{item.quantity}</span>
                </span>
                <span className="font-medium text-foreground">
                  {formatNAD(item.priceCents * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <span className="text-base font-bold text-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">
              {formatNAD(order.subtotal)}
            </span>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="rounded-xl border border-border bg-accent/50 p-6 space-y-4 mb-8">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">What happens next?</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                We&apos;ll review your order and check product availability.
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                We&apos;ll contact you via {order?.preferredContact || "your preferred method"}.
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                We&apos;ll arrange collection from our Windhoek location.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact CTAs */}
      <div className="space-y-3">
        <a
          href={buildWhatsAppUrl(whatsapp, decodeURIComponent(shareMessage.replace(/^"|"$/g, "")))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-whatsapp/20 bg-whatsapp-soft px-6 py-3.5 text-sm font-semibold text-whatsapp transition-all hover:-translate-y-0.5 hover:border-whatsapp/30 hover:bg-whatsapp hover:text-white hover:shadow-md active:translate-y-0"
        >
          <MessageCircle className="h-5 w-5" />
          Chat on WhatsApp
        </a>
        <a
          href={`tel:${phone}`}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-muted hover:shadow-sm active:scale-[0.98]"
        >
          <Phone className="h-5 w-5" />
          Call {phone}
        </a>
      </div>

      {/* Continue Shopping */}
      <div className="mt-8 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          Continue Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
