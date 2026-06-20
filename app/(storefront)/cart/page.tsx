"use client";

import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  MessageCircle,
  Phone,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/store/cart";
import { formatNAD } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/lib/store/dashboard";
import { ProductImage } from "@/components/ui/product-image";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getSubtotal } = useCart();
  const settings = useDashboardStore((s) => s.settings);
  const [isClearing, setIsClearing] = useState(false);

  const subtotal = getSubtotal();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const whatsappNumber = settings.whatsapp || "264000000000";
  const phoneNumber = settings.phone || "+264000000000";

  const cartWhatsAppMessage = encodeURIComponent(
    `Hi, I'd like to enquire about the following items:\n\n${items.map((i) => `- ${i.name} x${i.quantity} (${formatNAD(i.priceCents * i.quantity)})`).join("\n")}\n\nTotal: ${formatNAD(subtotal)}`,
  );

  const handleClearCart = () => {
    if (items.length === 0) return;
    setIsClearing(true);
    clearCart();
    setTimeout(() => setIsClearing(false), 300);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Your cart is empty</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            Browse our catalog and add products to get started. We&apos;ll help you through the ordering process.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Shopping Cart</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {itemCount} item{itemCount !== 1 ? "s" : ""} in your cart
          </p>
        </div>
        <button
          onClick={handleClearCart}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Clear All
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
            >
              {/* Image */}
              <Link
                href={`/shop/${item.slug}`}
                className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-border"
              >
                <ProductImage
                  src={item.imageUrl}
                  alt={item.name}
                  showFallbackText={false}
                />
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/shop/${item.slug}`}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{item.specs}</p>
                <p className="text-sm font-bold text-foreground mt-2">
                  {formatNAD(item.priceCents * item.quantity)}
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-l-lg"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex h-8 w-10 items-center justify-center text-sm font-medium text-foreground border-x border-border">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-r-lg"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <Link
                    href={buildWhatsAppUrl(whatsappNumber, `Hi, I'm interested in the ${item.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 ml-auto text-xs font-medium text-whatsapp hover:text-whatsapp-hover transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Enquire
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-lg font-bold text-foreground">Order Summary</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                <span className="font-semibold text-foreground">{formatNAD(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Collection</span>
                <span className="font-semibold text-success">Free</span>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-base font-bold text-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">{formatNAD(subtotal)}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/checkout"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
              >
                <ShoppingBag className="h-4 w-4" />
                Proceed to Checkout
              </Link>

              <a
                href={buildWhatsAppUrl(whatsappNumber, decodeURIComponent(cartWhatsAppMessage))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-whatsapp/20 bg-whatsapp-soft px-5 py-3 text-sm font-semibold text-whatsapp transition-all hover:-translate-y-0.5 hover:border-whatsapp/30 hover:bg-whatsapp hover:text-white hover:shadow-md active:translate-y-0"
              >
                <MessageCircle className="h-4 w-4" />
                Enquire on WhatsApp
              </a>

              <a
                href={`tel:${phoneNumber}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
              >
                <Phone className="h-4 w-4" />
                Call to Order
              </a>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              We&apos;ll confirm availability and arrange collection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
