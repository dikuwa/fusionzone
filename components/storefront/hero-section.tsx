"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useDashboardStore } from "@/lib/store/dashboard";
import { decodeHTMLEntities } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";
import { fadeUpVariants, motionTransition } from "@/lib/motion";

const DEFAULT_HEADING = "Namibia&rsquo;s tech — tested, warranted, and a message away.";
const DEFAULT_SUBHEADING =
  "Shop laptops, phones, gaming builds, CCTV, networking and POS gear with clear pricing, tested stock and direct local assistance.";
const DEFAULT_IMAGE = "/images/fusionzone-hero.png";

export function HeroSection() {
  // Read settings from the shared zustand store (persisted to localStorage).
  // Falls back to hardcoded defaults if the store hasn't been configured yet.
  const settings = useDashboardStore((s) => s.settings);

  const heading = settings.heroHeading || DEFAULT_HEADING;
  const subheading = settings.heroSubheading || DEFAULT_SUBHEADING;
  const imageUrl = settings.heroImageUrl || DEFAULT_IMAGE;
  const whatsapp = settings.whatsapp || "264000000000";
  const phone = settings.phone || "+264000000000";

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden border-b border-border bg-background"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[0.98fr_1.02fr] lg:px-8 lg:py-12">
        {/* Image first on mobile, second on desktop */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={motionTransition(false, 0.35)}
          className="min-w-0 -mr-4 sm:-mr-6 lg:-mr-8 -mb-8 lg:-mb-12 overflow-hidden lg:order-2"
        >
          <img
            src={imageUrl}
            alt="FusionZone electronics showroom"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Text second on mobile, first on desktop */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={motionTransition(false, 0.35)}
          className="flex flex-col justify-center lg:order-1"
        >
          <div className="mb-5 inline-flex w-fit items-center rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-xs">
            FusionZone, Namibia
          </div>

          {/* Admin-controlled heading - safely renders HTML entities like &rsquo; without XSS risk */}
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.04] text-foreground sm:text-5xl">
            {decodeHTMLEntities(heading)}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            {subheading}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md active:translate-y-0"
            >
              Shop products
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={buildWhatsAppUrl(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-whatsapp/30 hover:bg-whatsapp-soft hover:text-whatsapp active:translate-y-0"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp an expert
            </a>
          </div>

          {/* Trust indicators - centered mini feature cards */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            transition={motionTransition(false, 0.45)}
            className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6"
          >
            {[
              { label: "Tested stock", icon: ShieldCheck },
              { label: "Warranty options", icon: BadgeCheck },
              { label: "Nationwide courier", icon: Truck },
              { label: "Call us", sub: phone, icon: Phone },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-2.5 text-center"
                >
                  <span
                    className="flex items-center justify-center rounded-lg bg-muted text-primary border border-black/[0.04]"
                    style={{
                      width: "44px",
                      height: "44px",
                      minWidth: "44px",
                      minHeight: "44px",
                      flexShrink: 0,
                      aspectRatio: "1 / 1",
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="text-sm font-medium leading-tight text-muted-foreground">
                    <span>{item.label}</span>
                    {item.sub && <span className="block text-xs">{item.sub}</span>}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
