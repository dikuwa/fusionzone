"use client";

"use client";

import { MessageCircle, Phone } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp-url";
import { useDashboardStore } from "@/lib/store/dashboard";

export function MobileStickyCTA() {
  const settings = useDashboardStore((s) => s.settings);
  const phone = settings.phone || "+264000000000";
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border bg-background lg:hidden">
      <div className="flex items-center gap-2 px-4 py-2">
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-whatsapp/20 bg-whatsapp-soft px-4 py-3 text-sm font-medium text-whatsapp transition-colors hover:bg-whatsapp hover:text-white"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp Us
        </a>
        <a
          href={`tel:${phone}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Phone className="h-5 w-5" />
          Call Now
        </a>
      </div>
    </div>
  );
}
