"use client";

import { Toaster } from "sonner";

export function StorefrontToaster() {
  return (
    <Toaster
      position="bottom-center"
      visibleToasts={3}
      expand={false}
      toastOptions={{
        className: "text-sm font-medium",
        style: {
          background: "var(--color-card)",
          color: "var(--color-foreground)",
          border: "1px solid var(--color-border)",
        },
        classNames: {
          success:
            "!bg-[#E8F7EE] !text-[#15803D] !border-[#15803D]/30",
          error:
            "!bg-[#e8eeff] !text-[#0d41e2] !border-[#0d41e2]/30",
        },
      }}
    />
  );
}
