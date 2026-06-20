import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Download, Printer, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/dashboard-data";

interface PublicQuotationPageProps {
  params: Promise<{ token: string }>;
}

import { getAppUrl } from "@/lib/app-url";
import { getStoreSettings } from "@/lib/store-settings";

async function fetchDocument(token: string) {
  const baseUrl = getAppUrl();
  try {
    const res = await fetch(`${baseUrl}/api/documents/token?token=${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    Draft: "bg-muted text-muted-foreground border-border",
    Sent: "bg-primary/10 text-primary border-primary/20",
    Accepted: "bg-success/10 text-success border-success/20",
    Declined: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return map[status] || "bg-muted text-muted-foreground border-border";
}

export default async function PublicQuotationPage({ params }: PublicQuotationPageProps) {
  const { token } = await params;
  const result = await fetchDocument(token);

  if (!result?.success || result.type !== "quotation") {
    notFound();
  }

  const storeSettings = await getStoreSettings();

  const { data } = result;
  const items = data.items || [];
  const date = new Date(data.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/images/fusionzone-mark.svg"
              alt="FusionZone"
              className="h-8 w-auto"
            />
            <span className="text-sm font-bold text-foreground">FusionZone</span>
          </Link>
          <span className="rounded-md bg-primary/10 text-primary px-2.5 py-1 text-[10px] font-bold tracking-wider">
            QUOTATION
          </span>
        </div>

        {/* Quotation card */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">{storeSettings.storeName}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{storeSettings.address}</p>
              <p className="text-xs text-muted-foreground">{storeSettings.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground font-mono">{data.quotationNumber}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
            </div>
          </div>

          {/* Status */}
          <div className="px-6 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                getStatusBadgeClass(data.status)
              )}>
                {data.status === "Draft" && <Clock className="h-3 w-3 mr-1" />}
                {data.status === "Sent" && <FileText className="h-3 w-3 mr-1" />}
                {data.status === "Accepted" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {data.status === "Declined" && <XCircle className="h-3 w-3 mr-1" />}
                {data.status}
              </span>
            </div>
          </div>

          {/* Customer */}
          <div className="px-6 py-4 border-b border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Prepared For</p>
            <p className="text-sm font-semibold text-foreground">{data.customerName}</p>
            <p className="text-xs text-muted-foreground">{data.customerPhone}</p>
          </div>

          {/* Items */}
          <div className="px-6 py-4 border-b border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quoted Items</p>
            <div className="space-y-2">
              <div className="flex items-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wider pb-1 border-b border-border">
                <span className="flex-1">Description</span>
                <span className="w-12 text-center">Qty</span>
                <span className="w-20 text-right">Price</span>
                <span className="w-20 text-right">Total</span>
              </div>
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center text-sm py-1">
                  <span className="flex-1 text-foreground">{item.name}</span>
                  <span className="w-12 text-center text-muted-foreground">{item.quantity}</span>
                  <span className="w-20 text-right text-foreground">{formatCents(item.unitPriceCents)}</span>
                  <span className="w-20 text-right font-semibold text-foreground">
                    {formatCents(item.unitPriceCents * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="px-6 py-4 border-b border-border">
            <div className="space-y-1.5 ml-auto max-w-[240px]">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCents(data.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-border pt-1.5 mt-1.5">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{formatCents(data.subtotalCents)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}

          {/* Contact */}
          <div className="px-6 py-4 bg-muted/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contact Us</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <a href={`tel:${storeSettings.phone}`} className="text-primary hover:underline">{storeSettings.phone}</a>
              <a href={`mailto:${storeSettings.email}`} className="text-primary hover:underline">{storeSettings.email}</a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-all"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Visit Store
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[10px] text-muted-foreground">
          {storeSettings.storeName} &mdash; {storeSettings.address}
        </p>
      </div>
    </div>
  );
}
