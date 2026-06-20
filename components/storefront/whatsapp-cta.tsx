"use client";

import { MessageCircle, Phone } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp-url";
import { useDashboardStore } from "@/lib/store/dashboard";

export function WhatsAppCTA() {
  const settings = useDashboardStore((s) => s.settings);
  const phone = settings.phone || "+264000000000";
  return (
    <section className="bg-background py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/50 text-primary">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  Need help choosing the right device?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send your budget and use case, the team can recommend a practical match.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:ml-auto sm:shrink-0">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md active:translate-y-0"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted active:translate-y-0"
              >
                <Phone className="h-4 w-4" />
                Call Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
