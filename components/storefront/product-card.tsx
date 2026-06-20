"use client";

import Link from "next/link";
import { Bell, Check, Heart, ShoppingCart, Tag } from "lucide-react";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { toast } from "sonner";
import { NotifyMeModal } from "@/components/storefront/notify-me-modal";
import { fadeUpVariants, motionTransition } from "@/lib/motion";
import { ProductImage } from "@/components/ui/product-image";

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  specs: string;
  priceCents: number;
  oldPriceCents?: number;
  discountPercent?: number;
  imageUrl?: string;
  availability: "in_stock" | "low_stock" | "sold_out";
  stockCount?: number;
  condition?: "New" | "Refurbished" | "Pre-Owned";
  rating?: number;
  reviewCount?: number;
}

interface ProductCardProps {
  product: ProductData;
}

function formatNAD(cents: number): string {
  return `N$ ${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

const availabilityConfig = {
  in_stock: {
    label: "In Stock",
    class: "bg-success-soft text-success border-success/20",
  },
  low_stock: {
    label: (count?: number) => `Low Stock${count ? ` (${count} left)` : ""}`,
    class: "bg-warning-soft text-warning border-warning/20",
  },
  sold_out: {
    label: "Out of Stock",
    class: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

export function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const reducedMotion = useReducedMotion();
  
  const wishlisted = isWishlisted(product.id);
  const isSoldOut = product.availability === "sold_out";
  const isLowStock = product.availability === "low_stock";
  const avail = availabilityConfig[product.availability];

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl || "",
      priceCents: product.priceCents,
      specs: product.specs,
      availability: product.availability,
    });
    setAddedToCart(true);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      transition={motionTransition(reducedMotion, 0.26)}
      className={cn(
        "group relative flex min-h-full flex-col overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md",
        isSoldOut ? "border-gray-200 opacity-75" : "border-border hover:-translate-y-0.5",
      )}
    >
      <button
        onClick={() => {
          toggleItem({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            imageUrl: product.imageUrl || "",
            priceCents: product.priceCents,
            specs: product.specs,
          });
          if (wishlisted) {
            toast.success("Removed from wishlist");
          } else {
            toast.success("Added to wishlist");
          }
        }}
        className={cn(
          "absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg border bg-card/95 shadow-xs transition-all",
          isSoldOut && "hidden",
          wishlisted
            ? "border-[#0d41e2]/40 bg-[#0d41e2]/10 text-[#0d41e2]"
            : "border-border text-muted-foreground hover:border-[#0d41e2]/40 hover:bg-[#0d41e2]/5 hover:text-[#0d41e2]",
        )}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart className={cn("h-4 w-4", wishlisted && "fill-[#0d41e2]")} />
      </button>

      <Link
        href={`/shop/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-gray-100"
      >
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5 pr-12">
          {product.discountPercent && !isSoldOut && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground">
              <Tag className="h-3 w-3" />
              -{product.discountPercent}%
            </span>
          )}
          {product.condition && (
            <span className="rounded-md border border-border bg-card/95 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              {product.condition}
            </span>
          )}
        </div>
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="transition-transform duration-300 group-hover:scale-105"
          showFallbackText={true}
          fallbackIconSize={24}
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "rounded-md border px-2 py-1 text-[11px] font-semibold",
              avail.class,
            )}
          >
            {typeof avail.label === "function" ? avail.label(product.stockCount) : avail.label}
            {product.stockCount && product.availability !== "sold_out" && (
              <span className="ml-1">&middot; {product.stockCount} available</span>
            )}
          </div>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          <Link href={`/shop/${product.slug}`} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </h3>

        <p className="line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{product.specs}</p>



        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-bold text-foreground">
            {formatNAD(product.priceCents)}
          </span>
          {product.oldPriceCents && (
            <span className="text-sm text-muted-foreground line-through">
              {formatNAD(product.oldPriceCents)}
            </span>
          )}
        </div>

        {isSoldOut ? (
          <NotifyMeModal productId={product.id} productName={product.name} />
        ) : (
          <button
              onClick={handleAddToCart}
              className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all hover:shadow-sm cursor-pointer ${
                addedToCart
                  ? "bg-success-soft text-success border border-success/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {addedToCart ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Add to Cart
                </>
              )}
            </button>
        )}
      </div>
    </motion.div>
  );
}
