"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  MessageCircle,
  Phone,
  Check,
  Bell,
  Truck,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import {
  dashboardProductToProductData,
  getProductBySlug,
  formatNAD,
  mergeProducts,
  type ProductData,
} from "@/lib/data";
import type { DashboardProduct } from "@/lib/dashboard-data";
import { useDashboardStore } from "@/lib/store/dashboard";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";
import { NotifyMeModal } from "@/components/storefront/notify-me-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/product-image";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const dashboardProducts = useDashboardStore((s) => s.products);
  const settings = useDashboardStore((s) => s.settings);
  const managedCategories = useDashboardStore((s) => s.categories);
  // Merge static + dashboard products and search for the slug
  const allProductsMerged = mergeProducts(dashboardProducts, managedCategories);
  const localProduct = allProductsMerged.find((p) => p.slug === slug) || getProductBySlug(slug);
  const [remoteProduct, setRemoteProduct] = useState<ProductData | null | undefined>(undefined);
  const product = localProduct || remoteProduct;
  const { addItem, items } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => {
    if (localProduct) return;
    fetch("/api/products")
      .then((response) => response.json())
      .then((data: { products?: DashboardProduct[] }) => {
        const match = data.products?.find((candidate) => candidate.slug === slug);
        setRemoteProduct(match ? dashboardProductToProductData(match, managedCategories) : null);
      })
      .catch(() => setRemoteProduct(null));
  }, [localProduct, slug, managedCategories]);
  const [addedToCart, setAddedToCart] = useState(false);
  const { toggleItem, isWishlisted } = useWishlist();
  

  if (!product && remoteProduct === undefined) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-sm text-muted-foreground">Loading product...</div>;
  }
  if (!product) notFound();

  const whatsappNumber = settings.whatsapp || "264000000000";
  const phoneNumber = settings.phone || "+264000000000";

  const wishlisted = isWishlisted(product.id);

  const isSoldOut = product.availability === "sold_out";
  const isLowStock = product.availability === "low_stock";
  const cartItem = items.find((i) => i.productId === product.id);
  const relatedProducts = allProductsMerged
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
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
    setAddedToCart(true);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const availabilityColor = {
    in_stock: "text-success bg-success-soft border-success/20",
    low_stock: "text-warning bg-warning-soft border-warning/20",
    sold_out: "text-muted-foreground bg-gray-100 border-gray-200",
  };

  const conditionColor = {
    New: "bg-blue-50 text-blue-700 border-blue-200",
    Refurbished: "bg-purple-50 text-purple-700 border-purple-200",
    "Pre-Owned": "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
        <span>/</span>
        <Link
          href={`/shop?category=${product.categorySlug}`}
          className="hover:text-foreground transition-colors"
        >
          {product.categoryName}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-gray-50 to-gray-100">
            <ProductImage
              src={product.images[selectedImage] || product.imageUrl}
              alt={product.name}
              className="w-full h-full transition-all duration-500"
            />
            {product.discountPercent && !isSoldOut && (
              <div className="absolute top-4 left-4 rounded-lg bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                -{product.discountPercent}%
              </div>
            )}
            <button
              onClick={() => toggleItem({
                productId: product.id,
                name: product.name,
                slug: product.slug,
                imageUrl: product.imageUrl,
                priceCents: product.priceCents,
                specs: product.specs,
              })}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm border border-border shadow-sm hover:shadow-md transition-all"
            >
              <Heart className={cn("h-5 w-5", wishlisted ? "fill-[#0d41e2] text-[#0d41e2]" : "text-muted-foreground")} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    "flex-shrink-0 w-[72px] h-[72px] rounded-lg border-2 overflow-hidden transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    selectedImage === idx
                      ? "border-primary ring-1 ring-primary/20"
                      : "border-border hover:border-muted-foreground/30",
                  )}
                  aria-label={`View product image ${idx + 1}`}
                >
                  <ProductImage
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    showFallbackText={false}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col gap-6">
          {/* Title & Badges */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold", conditionColor[product.condition])}>
                {product.condition}
              </span>
              <span className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold", availabilityColor[product.availability])}>
                {isSoldOut ? "Out of Stock" : isLowStock ? `Low Stock (${product.stockCount} left)` : "In Stock"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-muted-foreground">{product.brand}</span>
              {product.sku && (
                <>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>
                </>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">
              {formatNAD(product.priceCents)}
            </span>
            {product.oldPriceCents && (
              <span className="text-xl text-muted-foreground line-through">
                {formatNAD(product.oldPriceCents)}
              </span>
            )}
            {product.discountPercent && (
              <span className="rounded-md bg-primary/10 text-primary px-2.5 py-0.5 text-sm font-bold">
                Save {product.discountPercent}%
              </span>
            )}
          </div>

          {/* Warranty */}
          {product.warranty && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span>{product.warranty} warranty included</span>
            </div>
          )}

          {/* Description */}
          <p className="text-base text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          {/* Specs */}
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Key Specifications</h3>
            <p className="text-sm text-muted-foreground">{product.specs}</p>
          </div>

          {/* Add to Cart Section */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!isSoldOut ? (
              <button
                onClick={handleAddToCart}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all cursor-pointer",
                  addedToCart
                    ? "bg-success-soft text-success border border-success/30"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-[0.98]",
                )}
              >                  {addedToCart ? (
                  <>
                    <Check className="h-5 w-5" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    {hydrated && cartItem ? `Add Another (${cartItem.quantity} in cart)` : "Add to Cart"}
                  </>
                )}
              </button>
            ) : (
              <NotifyMeModal
                productId={product.id}
                productName={product.name}
                trigger={
                  <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.98]">
                    <Bell className="h-5 w-5" />
                    Notify Me
                  </button>
                }
              />
            )}
          </div>

          {/* WhatsApp & Call */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={buildWhatsAppUrl(whatsappNumber, `Hi, I'm interested in the ${product.name} (${formatNAD(product.priceCents)}). Is it available?`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-whatsapp/20 bg-whatsapp-soft px-6 py-3 text-sm font-semibold text-whatsapp transition-all hover:-translate-y-0.5 hover:border-whatsapp/30 hover:bg-whatsapp hover:text-white hover:shadow-md active:translate-y-0"
            >
              <MessageCircle className="h-5 w-5" />
              Enquire on WhatsApp
            </a>
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted hover:shadow-sm active:scale-[0.98]"
            >
              <Phone className="h-5 w-5" />
              Call Us
            </a>
          </div>

          {/* Trust features */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { icon: Truck, label: "Collection in Windhoek" },
              { icon: Truck, label: "Nationwide courier available" },
              { icon: ShieldCheck, label: "Quality Tested" },
              { icon: RotateCcw, label: "Warranty options" },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <feature.icon className="h-4 w-4 text-primary" />
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-10 border-t border-border">
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">
            Related Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((rp) => (
              <Link key={rp.id} href={`/shop/${rp.slug}`} className="group block">
                <div className="aspect-square rounded-xl overflow-hidden border border-border bg-gradient-to-br from-gray-50 to-gray-100 mb-3">
                  <ProductImage
                    src={rp.imageUrl}
                    alt={rp.name}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {rp.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{rp.specs}</p>
                <p className="text-sm font-bold text-foreground mt-1">{formatNAD(rp.priceCents)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
