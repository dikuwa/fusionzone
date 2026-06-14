"use client";

import Link from "next/link";
import { ShoppingCart, X, Minus, Plus, ArrowRight, Trash2 } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { formatNAD } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/product-image";
import { useState, useRef, useEffect } from "react";

export function CartDropdown() {
  const { items, getItemCount, getSubtotal, removeItem, updateQuantity } = useCart();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
        aria-label={`Cart (${itemCount} items)`}
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-1/2 top-[6.75rem] z-50 w-[calc(100vw-2rem)] max-w-[360px] -translate-x-1/2 rounded-xl border border-border bg-card shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px] sm:translate-x-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Cart ({itemCount})</p>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {items.slice(0, 5).map((item) => (
                  <div key={item.productId} className="flex gap-3 px-4 py-3">
                    <Link
                      href={`/shop/${item.slug}`}
                      className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-border flex-shrink-0"
                      onClick={() => setOpen(false)}
                    >
                      <ProductImage src={item.imageUrl} alt={item.name} showFallbackText={false} />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/shop/${item.slug}`}
                        className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                        onClick={() => setOpen(false)}
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs font-bold text-foreground mt-1">{formatNAD(item.priceCents * item.quantity)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-medium text-foreground">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length > 5 && (
                  <p className="px-4 py-2 text-xs text-center text-muted-foreground">
                    +{items.length - 5} more item{items.length - 5 > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <div className="p-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold text-foreground">{formatNAD(subtotal)}</span>
                </div>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                    items.length > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                      : "bg-muted text-muted-foreground pointer-events-none",
                  )}
                >
                  View Cart
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
