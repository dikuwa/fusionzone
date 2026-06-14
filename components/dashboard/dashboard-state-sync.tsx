"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/lib/store/dashboard";

export function DashboardStateSync() {
  const syncDashboardData = useDashboardStore((state) => state.syncDashboardData);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    fetch("/api/dashboard/state", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        syncDashboardData(data.state ?? {});
        unsubscribe = useDashboardStore.subscribe((state) => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            fetch("/api/dashboard/state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orders: state.orders,
                customers: state.customers,
                followUps: state.followUps,
                quotations: state.quotations,
                payments: state.payments,
                navOrder: state.navOrder,
              }),
            }).catch((error) => console.error("[dashboard-state] Could not persist data", error));
          }, 400);
        });
      })
      .catch((error) => console.error("[dashboard-state] Could not sync data", error));

    return () => {
      active = false;
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, [syncDashboardData]);

  return null;
}
