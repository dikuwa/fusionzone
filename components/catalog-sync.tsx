"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/lib/store/dashboard";

const DEFAULT_CATEGORIES: Record<string, { description: string; sortOrder: number }> = {
  apple: { description: "MacBooks, iPads, iPhones", sortOrder: 1 },
  windows: { description: "Dell, HP, Lenovo", sortOrder: 2 },
  gaming: { description: "Gaming desktops and laptops", sortOrder: 3 },
  cctv: { description: "Cameras and security systems", sortOrder: 4 },
  networking: { description: "Routers, switches, WiFi", sortOrder: 5 },
  phones: { description: "Smartphones and tablets", sortOrder: 6 },
  accessories: { description: "Headsets, mice, keyboards", sortOrder: 7 },
  pos: { description: "POS hardware and peripherals", sortOrder: 8 },
};

const DEFAULT_BRANDS: Record<string, { description: string; isFeatured: boolean; sortOrder: number }> = {
  apple: { description: "MacBooks, iPads, iPhones", isFeatured: true, sortOrder: 1 },
  dell: { description: "Laptops, monitors, and workstations", isFeatured: true, sortOrder: 2 },
  hp: { description: "Laptops, printers, and desktops", isFeatured: false, sortOrder: 3 },
  lenovo: { description: "ThinkPad and IdeaPad laptops", isFeatured: false, sortOrder: 4 },
  asus: { description: "Gaming laptops and components", isFeatured: false, sortOrder: 5 },
  samsung: { description: "Phones, tablets, and monitors", isFeatured: false, sortOrder: 6 },
  hikvision: { description: "CCTV and security systems", isFeatured: false, sortOrder: 7 },
  logitech: { description: "Peripherals and accessories", isFeatured: false, sortOrder: 8 },
  ubiquiti: { description: "Networking equipment", isFeatured: false, sortOrder: 9 },
  sony: { description: "Audio and electronics", isFeatured: false, sortOrder: 10 },
  tplink: { description: "Networking and smart home", isFeatured: false, sortOrder: 11 },
  dahua: { description: "CCTV and security", isFeatured: false, sortOrder: 12 },
  "custom-build": { description: "Built-to-order systems", isFeatured: false, sortOrder: 13 },
};

export function CatalogSync({ importLocal = false }: { importLocal?: boolean }) {
  const syncCategories = useDashboardStore((state) => state.syncCategories);
  const syncBrands = useDashboardStore((state) => state.syncBrands);

  useEffect(() => {
    let active = true;
    const sync = async () => {
      const state = useDashboardStore.getState();
      const shouldImport = importLocal && !window.localStorage.getItem("fusionzone-catalog-imported-v2");
      const changedCategories = state.categories.filter((category) => {
        const baseline = DEFAULT_CATEGORIES[category.slug];
        return !baseline ||
          category.description !== baseline.description ||
          category.sortOrder !== baseline.sortOrder ||
          !category.isActive;
      });
      const changedBrands = state.brands.filter((brand) => {
        const baseline = DEFAULT_BRANDS[brand.slug];
        return !baseline ||
          brand.description !== baseline.description ||
          brand.isFeatured !== baseline.isFeatured ||
          brand.sortOrder !== baseline.sortOrder ||
          !brand.isActive ||
          Boolean(brand.logo);
      });
      const response = await fetch("/api/catalog", shouldImport ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: changedCategories,
          brands: changedBrands,
        }),
      } : { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (!active) return;
      syncCategories(data.categories ?? []);
      syncBrands(data.brands ?? []);
      if (shouldImport) window.localStorage.setItem("fusionzone-catalog-imported-v2", "true");
    };
    sync().catch((error) => console.error("[catalog] Could not sync catalog", error));
    return () => { active = false; };
  }, [importLocal, syncBrands, syncCategories]);

  return null;
}
