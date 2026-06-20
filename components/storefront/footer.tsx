"use client";

import Link from "next/link";
import { Phone, MessageCircle, Mail, MapPin, Building2, Banknote } from "lucide-react";
import { useDashboardStore } from "@/lib/store/dashboard";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";

export function StorefrontFooter() {
  const contactDetails = useDashboardStore((s) => s.contactDetails);
  const bankDetails = useDashboardStore((s) => s.bankDetails);
  const paymentMethods = useDashboardStore((s) => s.paymentMethods);

  const activeContacts = contactDetails.filter((c) => c.isActive);
  const phones = activeContacts.filter((c) => c.type === "phone");
  const whatsapps = activeContacts.filter((c) => c.type === "whatsapp");
  const emails = activeContacts.filter((c) => c.type === "email");
  const addresses = activeContacts.filter((c) => c.type === "address");
  const activeBanks = bankDetails.filter((b) => b.isActive);
  const activePayments = paymentMethods.filter((p) => p.isActive);

  return (
    <footer className="bg-[#0d41e2] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <img
                src="/images/fusionzone-logo-white.png"
                alt="FusionZone"
                className="h-8 w-auto"
              />
              <span className="text-lg font-bold">FusionZone</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Namibia&apos;s trusted source for new, pre-owned, and refurbished technology products — laptops, phones, gaming, CCTV, networking, POS & more.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Quick Links</h4>
            <ul className="mt-4 space-y-2">
              {[
                { href: "/shop", label: "Shop Products" },
                { href: "/wishlist", label: "Wishlist" },
                { href: "/services", label: "Our Services" },
                { href: "/promotions", label: "Promotions" },
                { href: "/contact", label: "Contact Us" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Banking */}
          <div className="space-y-5">
            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Contact</h4>
              <ul className="mt-4 space-y-3">
                {phones.length > 0 && phones.map((c) => (
                  <li key={c.id}>
                    <a
                      href={`tel:${c.value}`}
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      {c.label !== "Main" ? `${c.label}: ` : ""}{c.value}
                    </a>
                  </li>
                ))}
                {whatsapps.length > 0 && whatsapps.map((c) => (
                  <li key={c.id}>
                    <a
                      href={buildWhatsAppUrl(c.value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 flex-shrink-0" />
                      {c.label !== "Sales" ? `${c.label}: ` : ""}WhatsApp
                    </a>
                  </li>
                ))}
                {emails.length > 0 && emails.map((c) => (
                  <li key={c.id}>
                    <a
                      href={`mailto:${c.value}`}
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      {c.label !== "General" ? `${c.label}: ` : ""}{c.value}
                    </a>
                  </li>
                ))}
                {addresses.map((c) => (
                  <li key={c.id} className="flex items-start gap-2 text-sm text-white/60">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{c.value}{c.label !== "Physical" ? ` (${c.label})` : ""}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Banking Details */}
            {activeBanks.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-3">
                <h5 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Banking Details</h5>
                {activeBanks.map((b) => (
                  <div key={b.id} className="text-xs text-white/50">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" />
                      <p className="font-medium text-white/70">{b.bankName}</p>
                    </div>
                    <p className="ml-5">{b.accountName}</p>
                    <p className="ml-5 font-mono">
                      Account: {b.accountNumber}
                      {b.branchCode ? ` | Branch: ${b.branchCode}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Methods */}
            {activePayments.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <h5 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">We Accept</h5>
                <div className="flex flex-wrap gap-2">
                  {activePayments.map((pm) => (
                    <span
                      key={pm.id}
                      className="inline-flex items-center rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70"
                    >
                      {pm.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
            <p>&copy; {new Date().getFullYear()} FusionZone. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
              <span>|</span>
              <Link href="/terms" className="hover:text-white/60 transition-colors">Terms &amp; Conditions</Link>
              <span>|</span>
              <a href="https://www.flextech-media.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Designed by FlexTech Media</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
