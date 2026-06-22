"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/lib/store/dashboard";



export function CatalogSync() {
  const syncCategories = useDashboardStore((state) => state.syncCategories);
  const syncBrands = useDashboardStore((state) => state.syncBrands);

  useEffect(() => {
    let active = true;

    fetch("/api/catalog", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Catalog fetch failed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        syncCategories(data.categories ?? []);
        syncBrands(data.brands ?? []);
      })
      .catch((error) => console.error("[catalog] Could not sync catalog", error));

    return () => { active = false; };
  }, [syncBrands, syncCategories]);

  return null;
}
