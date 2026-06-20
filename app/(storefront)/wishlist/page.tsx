"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Phone, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useWishlist } from "@/lib/store/wishlist";
import { formatNAD } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/product-image";
import { buildWhatsAppUrl, WHATSAPP_MESSAGES } from "@/lib/whatsapp-url";
import { useDashboardStore } from "@/lib/store/dashboard";
import { toast } from "sonner";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist, getItemCount } = useWishlist();
  const settings = useDashboardStore((s) => s.settings);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const whatsappNumber = settings.whatsapp || "264000000000";
  const phoneNumber = settings.phone || "+264000000000";

  const handleRemove = (productId: string) => {
    setRemovingId(productId);
    removeItem(productId);
    toast.success("Removed from wishlist");
    setTimeout(() => setRemovingId(null), 300);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
            <Heart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Your wishlist is empty</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            Save products you want to enquire about later.
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Wishlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {getItemCount()} product{getItemCount() !== 1 ? "s" : ""} saved
          </p>
        </div>
        <button
          onClick={() => { clearWishlist(); toast.success("Wishlist cleared"); }}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Clear All
        </button>
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className={cn(
              "flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm",
              removingId === item.productId && "opacity-50",
            )}
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
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.specs}</p>
              <p className="text-sm font-bold text-foreground mt-2">
                {formatNAD(item.priceCents)}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
                <Link
                  href={`/shop/${item.slug}`}
                  className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  View Product
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* WhatsApp Enquiry CTA */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Interested in these products?</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Send an enquiry via WhatsApp for all {getItemCount()} item{getItemCount() !== 1 ? "s" : ""}.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={buildWhatsAppUrl(whatsappNumber, items.length === 1 ? WHATSAPP_MESSAGES.product(items[0].name) : WHATSAPP_MESSAGES.enquiry(items.map(i => i.name)))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-whatsapp/20 bg-whatsapp-soft px-5 py-2.5 text-sm font-semibold text-whatsapp transition-all hover:-translate-y-0.5 hover:border-whatsapp/30 hover:bg-whatsapp hover:text-white active:translate-y-0"
            >
              <MessageCircle className="h-4 w-4" />
              Enquire on WhatsApp
            </a>
            <a
              href={`tel:${phoneNumber}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted active:translate-y-0"
            >
              <Phone className="h-4 w-4" />
              Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
