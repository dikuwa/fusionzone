"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  X,
  ShoppingBag,
  Wrench,
  Phone,
  Search,
  ArrowRight,
  Tag,
  Heart,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/lib/store/mobile-menu";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { formatNAD, mergeProducts, type ProductData } from "@/lib/data";
import { useDashboardStore } from "@/lib/store/dashboard";
import { buildShopUrl, getActiveBrands, groupActiveCategories } from "@/lib/storefront-navigation";

export function MobileDrawer() {
  const pathname = usePathname();
  const { isOpen, close } = useMobileMenu();
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const wishlistCount = useWishlist((s) => s.items.length);
  const managedCategories = useDashboardStore((state) => state.categories);
  const managedBrands = useDashboardStore((state) => state.brands);
  const [shopExpanded, setShopExpanded] = useState(false);
  const [activeSubgroup, setActiveSubgroup] = useState<string | null>(null);

  const categoryGroups = groupActiveCategories(managedCategories);
  const displayBrands = getActiveBrands(managedBrands).slice(0, 12);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Get products from dashboard store for search
  const dashboardProducts = useDashboardStore((s) => s.products);
  const dashboardCategories = useDashboardStore((s) => s.categories);

  // Compute search results from dashboard products
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const allProducts = mergeProducts(dashboardProducts, dashboardCategories);
    const q = searchQuery.toLowerCase();
    return allProducts.filter(
      (p: ProductData) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.specs.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [searchQuery, dashboardProducts, dashboardCategories]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) {
      setShopExpanded(false);
      setActiveSubgroup(null);
    }
  }, [isOpen]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] md:hidden transition-opacity duration-300 ease-out",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      )}
      onClick={close}
    >
      {/* Drawer panel */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-[88vw] max-w-[420px] bg-[#fbf8f3] border-l border-[#e7dfd5] shadow-2xl flex flex-col overflow-y-auto rounded-l-lg transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-16 shrink-0 sticky top-0 bg-[#fbf8f3] z-10">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={close}
          >
            <img
              src="/images/fusionzone-mark.svg"
              alt="FusionZone"
              className="h-8 w-auto"
            />
            <span className="text-base font-bold text-foreground">FusionZone</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/wishlist"
              className="flex items-center justify-center h-11 w-11 rounded-lg text-muted-foreground hover:text-[#0d41e2] hover:bg-[#0d41e2]/5 transition-colors relative"
              onClick={close}
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0d41e2] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#fbf8f3]">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="flex items-center justify-center h-11 w-11 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
              onClick={close}
            >
              <ShoppingCart className="h-5 w-5" />
              {hydrated && itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-[#fbf8f3]">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={close}
              className="flex items-center justify-center h-11 w-11 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close menu"
              autoFocus
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pb-3" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="h-10 w-full rounded-xl border border-[#e7dfd5] bg-white pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none transition-colors"
            />
            {searchQuery.trim() && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-[#e7dfd5] bg-white shadow-lg max-h-64 overflow-y-auto">
                {searchResults.slice(0, 6).map((product) => (
                  <Link
                    key={product.id}
                    href={`/shop/${product.slug}`}
                    onClick={() => { close(); setSearchQuery(""); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatNAD(product.priceCents)}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
                {searchResults.length > 6 && (
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => { close(); setSearchQuery(""); }}
                    className="flex items-center justify-center gap-1 border-t border-border px-3 py-2.5 text-xs font-medium text-primary hover:bg-muted transition-colors"
                  >
                    View all {searchResults.length} results
                  </Link>
                )}
              </div>
            )}
            {searchQuery.trim() && searchResults.length === 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-[#e7dfd5] bg-white shadow-lg px-3 py-4 text-center text-sm text-muted-foreground">
                No products found
              </div>
            )}
          </div>
        </div>

        {/* Navigation content */}
        <div className="flex-1 px-5 pb-6">
          <p className="px-3 pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Navigation
          </p>
          <nav className="space-y-0.5 text-left">
            {/* Top-level Shop accordion trigger */}
            <div className="border border-[#e7dfd5] rounded-xl overflow-hidden mb-2 bg-white">
              <button
                type="button"
                aria-expanded={shopExpanded}
                onClick={() => {
                  setShopExpanded(!shopExpanded);
                  setActiveSubgroup(null);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold transition-colors",
                  shopExpanded ? "text-primary bg-primary/5" : "text-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <span>Shop</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", shopExpanded && "rotate-180")} />
              </button>

              {/* Subgroups */}
              {shopExpanded && (
                <div className="border-t border-[#e7dfd5] divide-y divide-[#e7dfd5]/40 bg-[#fbf8f3]">
                  {/* Sub-item: All Products */}
                  <Link
                    href="/shop"
                    onClick={close}
                    className="flex items-center justify-between px-6 py-3 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span>All Products</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  </Link>

                  {/* Subgroup: Computers */}
                  <div>
                    <button
                      type="button"
                      aria-expanded={activeSubgroup === "computers"}
                      onClick={() => setActiveSubgroup(activeSubgroup === "computers" ? null : "computers")}
                      className={cn(
                        "flex w-full items-center justify-between px-6 py-3 text-xs font-semibold transition-colors",
                        activeSubgroup === "computers" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>Computers</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200", activeSubgroup === "computers" && "rotate-180")} />
                    </button>
                    {activeSubgroup === "computers" && (
                      <div className="bg-white/50 px-8 py-2 space-y-2 border-t border-[#e7dfd5]/20">
                        {categoryGroups.computers.map(cat => (
                          <Link
                            key={cat.id}
                            href={buildShopUrl("category", cat.slug)}
                            onClick={close}
                            className="block py-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subgroup: Mobile & Entertainment */}
                  <div>
                    <button
                      type="button"
                      aria-expanded={activeSubgroup === "mobile"}
                      onClick={() => setActiveSubgroup(activeSubgroup === "mobile" ? null : "mobile")}
                      className={cn(
                        "flex w-full items-center justify-between px-6 py-3 text-xs font-semibold transition-colors",
                        activeSubgroup === "mobile" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>Mobile & Entertainment</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200", activeSubgroup === "mobile" && "rotate-180")} />
                    </button>
                    {activeSubgroup === "mobile" && (
                      <div className="bg-white/50 px-8 py-2 space-y-2 border-t border-[#e7dfd5]/20">
                        {categoryGroups.mobile.map(cat => (
                          <Link
                            key={cat.id}
                            href={buildShopUrl("category", cat.slug)}
                            onClick={close}
                            className="block py-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subgroup: Business & Security */}
                  <div>
                    <button
                      type="button"
                      aria-expanded={activeSubgroup === "business"}
                      onClick={() => setActiveSubgroup(activeSubgroup === "business" ? null : "business")}
                      className={cn(
                        "flex w-full items-center justify-between px-6 py-3 text-xs font-semibold transition-colors",
                        activeSubgroup === "business" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>Business & Security</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200", activeSubgroup === "business" && "rotate-180")} />
                    </button>
                    {activeSubgroup === "business" && (
                      <div className="bg-white/50 px-8 py-2 space-y-2 border-t border-[#e7dfd5]/20">
                        {categoryGroups.business.map(cat => (
                          <Link
                            key={cat.id}
                            href={buildShopUrl("category", cat.slug)}
                            onClick={close}
                            className="block py-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {categoryGroups.other.length > 0 && (
                    <div>
                      <button
                        type="button"
                        aria-expanded={activeSubgroup === "other"}
                        onClick={() => setActiveSubgroup(activeSubgroup === "other" ? null : "other")}
                        className={cn(
                          "flex w-full items-center justify-between px-6 py-3 text-xs font-semibold transition-colors",
                          activeSubgroup === "other" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span>Other Categories</span>
                        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200", activeSubgroup === "other" && "rotate-180")} />
                      </button>
                      {activeSubgroup === "other" && (
                        <div className="bg-white/50 px-8 py-2 space-y-2 border-t border-[#e7dfd5]/20">
                          {categoryGroups.other.map((cat) => (
                            <Link
                              key={cat.id}
                              href={buildShopUrl("category", cat.slug)}
                              onClick={close}
                              className="block py-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subgroup: Brands */}
                  <div>
                    <button
                      type="button"
                      aria-expanded={activeSubgroup === "brands"}
                      onClick={() => setActiveSubgroup(activeSubgroup === "brands" ? null : "brands")}
                      className={cn(
                        "flex w-full items-center justify-between px-6 py-3 text-xs font-semibold transition-colors",
                        activeSubgroup === "brands" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>Brands</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200", activeSubgroup === "brands" && "rotate-180")} />
                    </button>
                    {activeSubgroup === "brands" && (
                      <div className="bg-white/50 px-8 py-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#e7dfd5]/20">
                        {displayBrands.map(brand => (
                          <Link
                            key={brand.id}
                            href={buildShopUrl("brand", brand.name)}
                            onClick={close}
                            className="py-0.5 text-xs text-muted-foreground hover:text-primary transition-colors truncate"
                          >
                            {brand.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Promotions Link */}
            <Link
              href="/promotions"
              onClick={close}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors mb-2 border border-[#e7dfd5] bg-white",
                pathname === "/promotions"
                  ? "text-primary border-primary/20 bg-primary/5"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Tag className="h-5 w-5 text-primary" />
              <span>Promotions</span>
            </Link>

            {/* Services Link */}
            <Link
              href="/services"
              onClick={close}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors mb-2 border border-[#e7dfd5] bg-white",
                pathname === "/services"
                  ? "text-primary border-primary/20 bg-primary/5"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Wrench className="h-5 w-5 text-primary" />
              <span>Our Services</span>
            </Link>

            {/* Contact Link */}
            <Link
              href="/contact"
              onClick={close}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors mb-2 border border-[#e7dfd5] bg-white",
                pathname === "/contact"
                  ? "text-primary border-primary/20 bg-primary/5"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Phone className="h-5 w-5 text-primary" />
              <span>Contact</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
