"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Percent,
  ShoppingCart,
  Tag,
  Check,
  Sparkles,
  Clock,
  Wrench,
  Package,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDashboardStore } from "@/lib/store/dashboard";
import { getPromotionProducts, formatNAD, type ProductData } from "@/lib/data";
import { useCart } from "@/lib/store/cart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/product-image";
import { buildWhatsAppUrl, WHATSAPP_MESSAGES } from "@/lib/whatsapp-url";
import { isPublicPromotion } from "@/lib/promotion-visibility";

export default function PromotionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const dashboardPromotions = useDashboardStore((s) => s.promotions);
  const settings = useDashboardStore((s) => s.settings);
  const { addItem, items } = useCart();
  const [hydrated, setHydrated] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  useEffect(() => { setHydrated(true); }, []);

  // Find the promotion from the dashboard store
  const rawPromo = dashboardPromotions.find((p) => p.slug === slug);

  if (!rawPromo || !isPublicPromotion(rawPromo)) notFound();

  const promotion = {
    id: rawPromo.id,
    title: rawPromo.title,
    slug: rawPromo.slug,
    description: rawPromo.description,
    imageUrl: rawPromo.imageUrl,
    discountLabel: rawPromo.discountLabel,
    isActive: rawPromo.isActive,
    isFeatured: rawPromo.isFeatured !== false,
    placement: rawPromo.placement,
    type: (rawPromo.type || "general") as "product" | "bundle" | "service" | "general",
    linkedProductId: rawPromo.linkedProductId,
    linkedCategory: rawPromo.linkedCategory,
    serviceSlug: rawPromo.serviceSlug,
    ctaLabel: rawPromo.ctaLabel,
  };

  const relatedProducts = getPromotionProducts(promotion as any);
  const otherPromotions = dashboardPromotions
    .filter((p) => isPublicPromotion(p) && p.id !== rawPromo.id)
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      imageUrl: p.imageUrl,
      discountLabel: p.discountLabel,
      isFeatured: p.isFeatured !== false,
      type: (p.type || "general") as "product" | "bundle" | "service" | "general",
    }));
  const sidebarPromos = [
    ...otherPromotions.filter((p) => p.isFeatured),
    ...otherPromotions.filter((p) => !p.isFeatured),
  ].slice(0, 3);

  const handleAddToCart = (product: ProductData) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      priceCents: product.priceCents,
      specs: product.specs,
      availability: product.availability,
    });
    setAddedItems((prev) => new Set(prev).add(product.id));
    toast.success(`${product.name} added to cart`);
    setTimeout(() => {
      setAddedItems((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const handleAddAllToCart = () => {
    const available = relatedProducts.filter(
      (p) => p.availability === "in_stock" || p.availability === "low_stock",
    );
    available.forEach((product) => {
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        specs: product.specs,
        availability: product.availability,
      });
    });
    toast.success(`Added ${available.length} item${available.length > 1 ? "s" : ""} to cart`);
  };

  const promoTypeLabel: Record<string, string> = {
    product: "Product Offer",
    bundle: "Bundle Deal",
    service: "Service Offer",
    general: "Special Offer",
  };

  const promoTypeIcon: Record<string, React.ElementType> = {
    product: Tag,
    bundle: Package,
    service: Wrench,
    general: Sparkles,
  };

  const TypeIcon = promoTypeIcon[promotion.type];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/promotions" className="hover:text-foreground transition-colors">Promotions</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground truncate">{promotion.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* Main Content */}
        <div>
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {promotion.imageUrl ? (
              <div className="aspect-[21/9] overflow-hidden bg-muted sm:aspect-[3/1]">
                <img
                  src={promotion.imageUrl}
                  alt={promotion.title}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            ) : (
              <div className="flex aspect-[3/1] items-center justify-center bg-muted text-muted-foreground/30">
                <TypeIcon className="h-16 w-16" />
              </div>
            )}

            <div className="p-6 sm:p-8">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-xs font-semibold text-primary">
                <TypeIcon className="h-3.5 w-3.5" />
                {promoTypeLabel[promotion.type] || "Special Offer"}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {promotion.title}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {promotion.discountLabel && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                    <Percent className="h-3.5 w-3.5" />
                    {promotion.discountLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Limited time offer
                </span>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {promotion.description}
              </p>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-10">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {promotion.type === "bundle" ? "In this bundle" : "Included products"}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    {relatedProducts.length} product{relatedProducts.length > 1 ? "s" : ""} available
                  </h2>
                </div>
                {relatedProducts.length > 1 && (
                  <button
                    onClick={handleAddAllToCart}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-sm active:scale-[0.98]"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Add all to cart
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {relatedProducts.map((product) => {
                  const isSoldOut = product.availability === "sold_out";
                  const cartItem = items.find((i) => i.productId === product.id);
                  const justAdded = addedItems.has(product.id);

                  return (
                    <div
                      key={product.id}
                      className="group flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md"
                    >
                      <Link
                        href={`/shop/${product.slug}`}
                        className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:h-32 sm:w-32"
                      >
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="transition-transform duration-300 group-hover:scale-105"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <Link
                            href={`/shop/${product.slug}`}
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {product.brand} &middot; {product.categoryName}
                          </p>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                            {product.specs}
                          </p>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {formatNAD(product.priceCents)}
                          </span>
                          {product.oldPriceCents && (
                            <span className="text-xs text-muted-foreground line-through ml-1">
                              {formatNAD(product.oldPriceCents)}
                            </span>
                          )}
                        </div>

                        <div className="mt-2">
                          {isSoldOut ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                              Sold out
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(product)}
                              className={cn(
                                "w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                                justAdded
                                  ? "bg-success-soft text-success border border-success/30"
                                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-sm active:scale-[0.98]",
                              )}
                            >
                              {justAdded ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Added
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="h-3.5 w-3.5" />
                                  {hydrated && cartItem ? `Add (${cartItem.quantity})` : "Add to cart"}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* CTAs for all promotion types */}
          <section className="mt-10 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            {promotion.type === "service" ? (
              <Wrench className="mx-auto h-10 w-10 text-primary/60" />
            ) : (
              <Tag className="mx-auto h-10 w-10 text-primary/60" />
            )}
            <h2 className="mt-3 text-xl font-bold text-foreground">
              {promotion.type === "service" ? "Interested in this service?" : "Interested in this offer?"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {promotion.type === "service"
                ? "Contact us to enquire about this service. We&apos;ll get back to you with a quote."
                : "Contact us to enquire about this promotion. We&apos;re here to help."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={buildWhatsAppUrl(settings.whatsapp || "264000000000", WHATSAPP_MESSAGES.promotion(promotion.title))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
              >
                Enquire on WhatsApp
              </a>
              <a
                href={`tel:${settings.phone || "+264000000000"}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
              >
                Call us
              </a>
            </div>
          </section>
        </div>

        {/* Sidebar — Other Promotions */}
        {sidebarPromos.length > 0 && (
          <aside className="lg:border-l lg:border-border lg:pl-8">
            <div className="sticky top-28">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                More offers
              </p>
              <h3 className="mt-1 text-lg font-bold text-foreground">
                Other promotions
              </h3>

              <div className="mt-5 space-y-4">
                {sidebarPromos.map((promo) => {
                  const Icon = promoTypeIcon[promo.type];
                  return (
                    <Link
                      key={promo.id}
                      href={`/promotions/${promo.slug}`}
                      className="group flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                    >
                      {promo.imageUrl ? (
                        <ProductImage
                          src={promo.imageUrl}
                          alt={promo.title}
                          containerClassName="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
                          showFallbackText={false}
                        />
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/40">
                          <Icon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="inline-flex items-center gap-1 rounded bg-accent/50 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                          {promo.type === "service" ? "Service" : "Offer"}
                        </div>
                        <p className="mt-1 text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {promo.title}
                        </p>
                        {promo.discountLabel && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{promo.discountLabel}</p>
                        )}
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>

              <Link
                href="/promotions"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                View all promotions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
