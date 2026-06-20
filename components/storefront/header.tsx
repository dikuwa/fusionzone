"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  Phone,
  MessageCircle,
  Mail,
  Search,
  BadgeCheck,
  Heart,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useMobileMenu } from "@/lib/store/mobile-menu";
import { formatNAD, mergeProducts } from "@/lib/data";
import { CartDropdown } from "@/components/storefront/cart-dropdown";
import { useDashboardStore } from "@/lib/store/dashboard";
import { buildShopUrl, getActiveBrands, groupActiveCategories } from "@/lib/storefront-navigation";
import { buildWhatsAppUrl, formatWhatsAppPhone } from "@/lib/whatsapp-url";
import { isPublicPromotion } from "@/lib/promotion-visibility";



export function StorefrontHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const settings = useDashboardStore((s) => s.settings);
  const contactDetails = useDashboardStore((s) => s.contactDetails);
  const paymentMethods = useDashboardStore((s) => s.paymentMethods);
  const managedCategories = useDashboardStore((s) => s.categories);
  const managedBrands = useDashboardStore((s) => s.brands);
  const dashboardPromotions = useDashboardStore((s) => s.promotions);

  const categoryGroups = groupActiveCategories(managedCategories);
  const displayBrands = getActiveBrands(managedBrands).slice(0, 10);

  const activePromo = dashboardPromotions.find(p => isPublicPromotion(p) && p.placement === "HomeHero")
    || dashboardPromotions.find((p) => isPublicPromotion(p));

  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const whatsapp = settings.whatsapp || "264000000000";
  const phone = settings.phone || "+264000000000";
  const activePayments = paymentMethods.filter((p) => p.isActive);
  const { isOpen: mobileMenuOpen, toggle: toggleMobileMenu, close: closeMobileMenu } = useMobileMenu();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const wishlistCount = useWishlist((s) => s.items.length);

  // Get products from dashboard store for search
  const dashboardProducts = useDashboardStore((s) => s.products);
  const dashboardCategories = useDashboardStore((s) => s.categories);
  
  // Compute search results from dashboard products
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const allProducts = mergeProducts(dashboardProducts, dashboardCategories);
    const q = searchQuery.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.specs.toLowerCase().includes(q),
    ).slice(0, 8); // Limit to 8 results
  }, [searchQuery, dashboardProducts, dashboardCategories]);

  // Live search as user types
  useEffect(() => {
    if (searchQuery.trim()) {
      setShowSearchDropdown(true);
    } else {
      setShowSearchDropdown(false);
    }
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mobile menu: body scroll lock, blur class
  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      document.body.classList.remove("mobile-menu-open");
      return;
    }

    document.body.style.overflow = "hidden";
    document.body.classList.add("mobile-menu-open");

    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("mobile-menu-open");
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!megaMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!megaMenuRef.current?.contains(event.target as Node)) setMegaMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMegaMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [megaMenuOpen]);

  const handleSearch = useCallback((e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setShowSearchDropdown(false);
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/shop");
    }
  }, [searchQuery, router]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="bg-[#0d41e2] text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1 font-semibold text-white/90 hover:text-white transition-colors shrink-0"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">{phone}</span>
            </a>
            <span className="text-white/30">|</span>
            <a
              href={buildWhatsAppUrl(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-semibold text-white/90 hover:text-white transition-colors shrink-0"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">WhatsApp</span>
            </a>
            {/* Show additional contacts if available (hidden on small screens) */}
            {contactDetails.filter(c => c.isActive && c.type !== "phone" && c.type !== "whatsapp").length > 0 && (
              <>
                <span className="hidden sm:block text-white/30">|</span>
                {contactDetails.filter(c => c.isActive && c.type === "email").slice(0, 1).map(c => (
                  <a key={c.id} href={`mailto:${c.value}`} className="hidden sm:flex items-center gap-1 font-medium text-white/70 hover:text-white transition-colors shrink-0">
                    <Mail className="h-3 w-3" />
                    <span className="whitespace-nowrap">{c.value}</span>
                  </a>
                ))}
              </>
            )}
          </div>
          {/* Payment method tags - right side, hidden on mobile, no width constraint */}
          <div className="hidden sm:flex items-center gap-1">
            {activePayments.length > 0 ? (
              <div className="flex items-center gap-1">
                {activePayments.map(pm => (
                  <span
                    key={pm.id}
                    className="inline-flex rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/80 whitespace-nowrap"
                  >
                    {pm.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[11px] font-medium text-white/70 whitespace-nowrap">Cash or Bank Transfer</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2.5">
            <img
              src="/images/fusionzone-logo-blue.png"
              alt="FusionZone"
              className="h-9 w-auto"
            />
            <span className="leading-tight">
              <span className="block text-lg font-bold text-foreground">FusionZone</span>
              <span className="hidden text-[11px] font-semibold text-primary sm:block">
                Electronics retail
              </span>
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-auto">
            <div className="relative w-full" ref={searchRef}>
              <button onClick={handleSearch} className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center">
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search products, brands or categories..."
                className="h-10 w-full rounded-lg border border-border bg-muted/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
              />
              {/* Live search dropdown */}
              {showSearchDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-card shadow-lg max-h-80 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No results found for &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    <div className="py-1">
                      {searchResults.slice(0, 8).map((product) => (
                        <Link
                          key={product.id}
                          href={`/shop/${product.slug}`}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        >
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-10 w-10 flex-shrink-0 rounded-md object-cover border border-border"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.brand} &middot; {product.categoryName}</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground flex-shrink-0">
                            {formatNAD(product.priceCents)}
                          </span>
                        </Link>
                      ))}
                      {searchResults.length > 8 && (
                        <Link
                          href={`/search?q=${encodeURIComponent(searchQuery)}`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center justify-center gap-1 border-t border-border px-4 py-2.5 text-xs font-medium text-primary hover:bg-muted transition-colors"
                        >
                          View all {searchResults.length} results
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <a
              href={buildWhatsAppUrl(whatsapp, "Hi FusionZone, I need help with an order/product.")}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-whatsapp/30 hover:bg-whatsapp-soft hover:text-whatsapp active:translate-y-0 lg:flex"
            >
              <BadgeCheck className="h-4 w-4 text-whatsapp" />
              Ask expert
            </a>
            {/* Wishlist icon */}
            <Link
              href="/wishlist"
              className="relative flex items-center justify-center h-10 w-10 rounded-lg text-muted-foreground hover:text-[#0d41e2] hover:bg-[#0d41e2]/5 transition-colors"
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0d41e2] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            <CartDropdown />

            <button
              className="flex md:hidden items-center justify-center h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:block border-t border-border bg-card relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            ref={megaMenuRef}
            className="relative flex items-center justify-center gap-8 py-0"
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            {/* Shop Link with Mega Menu Trigger */}
            <div
              className="relative py-3"
              onMouseEnter={() => setMegaMenuOpen(true)}
            >
              <button
                type="button"
                onClick={() => setMegaMenuOpen((open) => !open)}
                aria-expanded={megaMenuOpen}
                aria-controls="storefront-shop-menu"
                aria-haspopup="menu"
                className={cn(
                  "flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer",
                  megaMenuOpen || pathname === "/shop"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>Shop</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", megaMenuOpen && "rotate-180")} />
              </button>

            </div>

            {/* Other nav links */}
            <Link
              href="/promotions"
              onMouseEnter={() => setMegaMenuOpen(false)}
              className={cn(
                "relative whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors",
                pathname === "/promotions" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Promotions
            </Link>
            <Link
              href="/services"
              onMouseEnter={() => setMegaMenuOpen(false)}
              className={cn(
                "relative whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors",
                pathname === "/services" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Our Services
            </Link>
            <Link
              href="/contact"
              onMouseEnter={() => setMegaMenuOpen(false)}
              className={cn(
                "relative whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors",
                pathname === "/contact" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Contact
            </Link>

            {/* Mega Menu Dropdown */}
            {megaMenuOpen && (
              <div
                id="storefront-shop-menu"
                className="absolute left-1/2 top-full z-50 mt-0.5 w-[calc(100vw-2rem)] max-w-4xl -translate-x-1/2 rounded-xl border border-border bg-background p-4 shadow-xl sm:p-6 lg:max-w-6xl"
              >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 text-left">
                    {/* Column 1: Shop All */}
                    <div>
                      <h4 className="font-bold text-foreground mb-3 uppercase tracking-wider text-[11px]">Shop All</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground font-normal">
                        <li>
                          <Link href="/shop" onClick={() => setMegaMenuOpen(false)} className="hover:text-primary transition-colors flex items-center gap-1.5">
                            All Products
                          </Link>
                        </li>
                        <li>
                          <Link href="/shop?sort=newest" onClick={() => setMegaMenuOpen(false)} className="hover:text-primary transition-colors flex items-center gap-1.5">
                            New Arrivals
                          </Link>
                        </li>
                        <li>
                          <Link href="/shop?condition=Pre-Owned" onClick={() => setMegaMenuOpen(false)} className="hover:text-primary transition-colors flex items-center gap-1.5">
                            Pre-Owned
                          </Link>
                        </li>
                        <li>
                          <Link href="/promotions" onClick={() => setMegaMenuOpen(false)} className="hover:text-primary transition-colors flex items-center gap-1.5">
                            Promotions
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Column 2: Computers */}
                    <div>
                      <h4 className="font-bold text-foreground mb-3 uppercase tracking-wider text-[11px]">Computers</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground font-normal">
                        {categoryGroups.computers.map((cat) => (
                          <li key={cat.id}>
                            <Link href={buildShopUrl("category", cat.slug)} onClick={() => setMegaMenuOpen(false)} className="hover:text-primary transition-colors">
                              {cat.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Column 3: Mobile & Entertainment */}
                    <div>
                      <h4 className="font-bold text-foreground mb-3 uppercase tracking-wider text-[11px]">Mobile & Entertainment</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground font-normal">
                        {categoryGroups.mobile.map((cat) => (
                          <li key={cat.id}>
                            <Link href={buildShopUrl("category", cat.slug)} onClick={() => setMegaMenuOpen(false)} className="hover:text-primary transition-colors">
                              {cat.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Column 4: Business & Security */}
                    <div>
                      <h4 className="font-bold text-foreground mb-3 uppercase tracking-wider text-[11px]">Business & Security</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground font-normal">
                        {categoryGroups.business.map((cat) => (
                          <li key={cat.id}>
                            <Link href={buildShopUrl("category", cat.slug)} onClick={() => setMegaMenuOpen(false)} className="hover:text-primary transition-colors">
                              {cat.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {categoryGroups.other.length > 0 && (
                      <div>
                        <h4 className="font-bold text-foreground mb-3 uppercase tracking-wider text-[11px]">Other Categories</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground font-normal">
                          {categoryGroups.other.map((cat) => (
                            <li key={cat.id}>
                              <Link href={buildShopUrl("category", cat.slug)} onClick={() => setMegaMenuOpen(false)} className="hover:text-primary transition-colors">
                                {cat.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Column 5: Brands & Promo Card */}
                    {activePromo ? (
                      <div className="grid grid-cols-2 sm:col-span-3 lg:col-span-2 gap-4 sm:gap-6 border-l border-border pl-4 sm:pl-6">
                        <div>
                          <h4 className="font-bold text-foreground mb-3 uppercase tracking-wider text-[11px]">Popular Brands</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground font-normal">
                            {displayBrands.slice(0, 5).map((brand) => (
                              <li key={brand.id}>
                                <Link href={buildShopUrl("brand", brand.name)} onClick={() => setMegaMenuOpen(false)} className="hover:text-primary transition-colors">
                                  {brand.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 flex flex-col justify-between h-full border border-border/50">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              Featured Deal
                            </span>
                            <h5 className="font-bold text-foreground mt-2 text-xs line-clamp-1">{activePromo.title}</h5>
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{activePromo.description}</p>
                          </div>
                          <Link
                            href={activePromo.linkedCategory ? buildShopUrl("category", activePromo.linkedCategory) : "/promotions"}
                            onClick={() => setMegaMenuOpen(false)}
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                          >
                            Shop Deals <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-foreground mb-3 uppercase tracking-wider text-[11px]">Popular Brands</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground font-normal">
                          {displayBrands.slice(0, 8).map((brand) => (
                            <li key={brand.id}>
                              <Link href={buildShopUrl("brand", brand.name)} onClick={() => setMegaMenuOpen(false)} className="hover:text-primary transition-colors">
                                {brand.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* The mobile drawer is rendered outside <header> in the layout */}
    </header>
  );
}
